from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from typing import List, Optional, Dict, Any
import json
from ...db.models import SearchQuery, ChatQuery, BotComponentResponse
from ...services.weaviate_service import weaviate_service
from ...services.rag_service import rag_service
from ...services.tenant_service import tenant_service
from ...core.security import get_tenant_id_from_api_key, get_tenant_id_from_query
from sqlalchemy.orm import Session
from ...db.session import get_db
import re
import asyncio

router = APIRouter()


@router.post("/search")
async def search(
    query: SearchQuery,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Führt eine semantische Suche in der Wissensbasis durch.
    Unterstützt hybride Suche (Vektor + Schlüsselwörter).
    """
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    results = weaviate_service.search(
        tenant_id=tenant_id,
        query=query.query,
        limit=query.limit,
        hybrid_search=query.hybrid_search
    )
    
    return {"results": results}


async def process_bot_response(response: str) -> Dict[str, Any]:
    """
    Verarbeitet die Bot-Antwort und extrahiert UI-Komponenten, falls vorhanden.
    """
    # Versuchen, JSON aus der Antwort zu extrahieren
    json_match = re.search(r'```(?:json)?\s*({[\s\S]*?})\s*```', response)
    
    if json_match:
        try:
            json_str = json_match.group(1)
            component_data = json.loads(json_str)
            
            # Prüfen, ob es sich um eine UI-Komponenten-Antwort handelt
            if "component" in component_data and "text" in component_data:
                component_response = BotComponentResponse(
                    text=component_data["text"],
                    component=component_data["component"],
                    data=component_data.get("data", {})
                )
                return component_response.model_dump()
        except Exception as e:
            print(f"Fehler beim Verarbeiten der JSON-Antwort: {str(e)}")
    
    # Falls kein JSON erkannt oder Fehler, einfacher Text zurückgeben
    return {"text": response}


@router.post("/completion")
async def completion(
    query: ChatQuery,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Generiert eine Antwort basierend auf den Chat-Nachrichten.
    """
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    use_mistral = query.use_mistral if query.use_mistral is not None else tenant.use_mistral
    
    # Wenn Streaming deaktiviert ist
    if not query.stream:
        full_response = ""
        async for chunk in rag_service.process_chat(
            tenant_id=tenant_id,
            messages=[{"role": msg.role, "content": msg.content} for msg in query.messages],
            system_prompt=query.custom_instructions,
            stream=False,
            use_mistral=use_mistral
        ):
            full_response += chunk
        
        # Verarbeite die Antwort, um UI-Komponenten zu extrahieren
        processed_response = await process_bot_response(full_response)
        return processed_response
    
    # Bei aktiviertem Streaming
    async def generate():
        try:
            # Buffer für die gesamte Antwort
            full_response = ""
            
            # Flag, um zu erkennen, ob wir möglicherweise in einem JSON-Block sind
            json_mode = False
            json_block_buffer = ""
            
            async for chunk in rag_service.process_chat(
                tenant_id=tenant_id,
                messages=[{"role": msg.role, "content": msg.content} for msg in query.messages],
                system_prompt=query.custom_instructions,
                stream=True,
                use_mistral=use_mistral
            ):
                # Zum Buffer hinzufügen für spätere Verarbeitung
                full_response += chunk
                
                # Prüfen, ob wir in einen JSON-Block eintreten oder darin sind
                if "```json" in chunk:
                    json_mode = True
                    # Nicht die JSON-Chunk-Anfangsmarkierung an den Client senden
                    # Stattdessen sammeln wir den JSON-Block
                    json_block_buffer = chunk.split("```json", 1)[1]
                    continue
                
                if json_mode:
                    json_block_buffer += chunk
                    
                    # Prüfen, ob der JSON-Block zu Ende ist
                    if "```" in json_block_buffer:
                        json_mode = False
                        json_str = json_block_buffer.split("```", 1)[0]
                        
                        # Versuchen, das JSON zu parsen
                        try:
                            json_obj = json.loads(json_str)
                            if "component" in json_obj and "text" in json_obj:
                                # Wir haben eine UI-Komponente gefunden!
                                # Wir senden nichts mehr streamed, sondern nur einen speziellen Event
                                # für die UI-Komponente
                                ui_component_event = json.dumps(json_obj)
                                yield f"event: ui_component\ndata: {ui_component_event}\n\n"
                                yield "event: done\ndata: \n\n"
                                # Streaming beenden, da wir die Komponente bereits gesendet haben
                                return
                        except json.JSONDecodeError:
                            # Keine gültige JSON, normal weitermachen
                            yield f"data: {json_block_buffer}\n\n"
                            
                        # Reset buffer
                        json_block_buffer = ""
                    
                    # Noch im JSON-Block, nichts senden
                    continue
                
                # Normale Chunks an Client senden
                yield f"data: {chunk}\n\n"
            
            # Am Ende der Antwort, überprüfen, ob UI-Komponenten vorhanden sind
            processed_response = await process_bot_response(full_response)
            
            # Wenn UI-Komponenten erkannt wurden, als speziellen Event senden
            if "component" in processed_response and not json_mode:
                ui_component_event = json.dumps(processed_response)
                yield f"event: ui_component\ndata: {ui_component_event}\n\n"
            
            # Sende das DONE-Event als separaten Server-Sent Event, nicht als Teil des Inhalts
            yield "event: done\ndata: \n\n"
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"
            yield "event: done\ndata: \n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@router.get("/embed")
async def get_embed_config(
    api_key: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Ruft die Konfiguration für ein eingebettetes Widget ab.
    """
    tenant_id = await get_tenant_id_from_query(api_key, db)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger API-Key"
        )
    
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    return {
        "botName": tenant.bot_name,
        "welcomeMessage": tenant.bot_welcome_message,
        "primaryColor": tenant.primary_color,
        "secondaryColor": tenant.secondary_color,
        "logoUrl": tenant.logo_url,
        "botMessageBgColor": tenant.bot_message_bg_color,
        "botMessageTextColor": tenant.bot_message_text_color,
        "userMessageBgColor": tenant.user_message_bg_color,
        "userMessageTextColor": tenant.user_message_text_color
    }


@router.post("/embed/chat")
async def embed_chat(
    query: ChatQuery,
    api_key: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Endpunkt für eingebettete Widgets.
    """
    tenant_id = await get_tenant_id_from_query(api_key, db)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger API-Key"
        )
    
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    use_mistral = query.use_mistral if query.use_mistral is not None else tenant.use_mistral
    
    # Wenn Streaming deaktiviert ist
    if not query.stream:
        full_response = ""
        async for chunk in rag_service.process_chat(
            tenant_id=tenant_id,
            messages=[{"role": msg.role, "content": msg.content} for msg in query.messages],
            system_prompt=query.custom_instructions or tenant.custom_instructions,
            stream=False,
            use_mistral=use_mistral
        ):
            full_response += chunk
        
        return {"response": full_response}
    
    # Bei aktiviertem Streaming
    async def generate():
        try:
            # Buffer für die gesamte Antwort
            full_response = ""
            
            # Flag, um zu erkennen, ob wir möglicherweise in einem JSON-Block sind
            json_mode = False
            json_block_buffer = ""
            
            async for chunk in rag_service.process_chat(
                tenant_id=tenant_id,
                messages=[{"role": msg.role, "content": msg.content} for msg in query.messages],
                system_prompt=query.custom_instructions,
                stream=True,
                use_mistral=use_mistral
            ):
                # Zum Buffer hinzufügen für spätere Verarbeitung
                full_response += chunk
                
                # Prüfen, ob wir in einen JSON-Block eintreten oder darin sind
                if "```json" in chunk:
                    json_mode = True
                    # Nicht die JSON-Chunk-Anfangsmarkierung an den Client senden
                    # Stattdessen sammeln wir den JSON-Block
                    json_block_buffer = chunk.split("```json", 1)[1]
                    continue
                
                if json_mode:
                    json_block_buffer += chunk
                    
                    # Prüfen, ob der JSON-Block zu Ende ist
                    if "```" in json_block_buffer:
                        json_mode = False
                        json_str = json_block_buffer.split("```", 1)[0]
                        
                        # Versuchen, das JSON zu parsen
                        try:
                            json_obj = json.loads(json_str)
                            if "component" in json_obj and "text" in json_obj:
                                # Wir haben eine UI-Komponente gefunden!
                                # Wir senden nichts mehr streamed, sondern nur einen speziellen Event
                                # für die UI-Komponente
                                ui_component_event = json.dumps(json_obj)
                                yield f"event: ui_component\ndata: {ui_component_event}\n\n"
                                yield "event: done\ndata: \n\n"
                                # Streaming beenden, da wir die Komponente bereits gesendet haben
                                return
                        except json.JSONDecodeError:
                            # Keine gültige JSON, normal weitermachen
                            yield f"data: {json_block_buffer}\n\n"
                            
                        # Reset buffer
                        json_block_buffer = ""
                    
                    # Noch im JSON-Block, nichts senden
                    continue
                
                # Normale Chunks an Client senden
                yield f"data: {chunk}\n\n"
            
            # Am Ende der Antwort, überprüfen, ob UI-Komponenten vorhanden sind
            processed_response = await process_bot_response(full_response)
            
            # Wenn UI-Komponenten erkannt wurden, als speziellen Event senden
            if "component" in processed_response and not json_mode:
                ui_component_event = json.dumps(processed_response)
                yield f"event: ui_component\ndata: {ui_component_event}\n\n"
            
            # Sende das DONE-Event als separaten Server-Sent Event, nicht als Teil des Inhalts
            yield "event: done\ndata: \n\n"
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"
            yield "event: done\ndata: \n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )


@router.options("/completion", include_in_schema=False)
@router.options("/embed/chat", include_in_schema=False)
async def options_chat():
    """Handler für OPTIONS-Anfragen an Chat-Endpunkte."""
    return {} 