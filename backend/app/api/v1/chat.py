from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
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
import logging

# Definiere get_user_id_from_query als einfache Dummy-Funktion
async def get_user_id_from_query(api_key: str = None):
    """
    Extrahiere eine User-ID aus dem API-Key oder Query-Parameter.
    In dieser einfachen Implementation geben wir None zurück.
    """
    return None

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
    Verarbeitet die Bot-Antwort und extrahiert UI-Komponenten und strukturierte Daten, falls vorhanden.
    """
    # Versuchen, JSON aus der Antwort zu extrahieren
    json_match = re.search(r'```(?:json)?\s*({[\s\S]*?})\s*```', response)
    
    # Standardantwort vorbereiten
    result = {"text": response, "interactive_elements": []}
    
    # Strukturierte Daten in der Antwort suchen
    structured_data_match = re.search(r'<structured_data>([\s\S]*?)</structured_data>', response)
    
    # Wenn strukturierte Daten gefunden wurden, diese extrahieren und zur Antwort hinzufügen
    if structured_data_match:
        try:
            structured_data_str = structured_data_match.group(1).strip()
            structured_data = json.loads(structured_data_str)
            
            # Strukturierte Daten zur Antwort hinzufügen
            result["structured_data"] = structured_data
            
            # Text bereinigen (strukturierte Daten-Tag entfernen)
            result["text"] = response.replace(structured_data_match.group(0), "").strip()
        except json.JSONDecodeError:
            # Wenn das JSON ungültig ist, Fehler loggen und ohne strukturierte Daten fortfahren
            logging.error(f"Ungültiges JSON in strukturierten Daten: {structured_data_match.group(1)}")
    
    # Wenn JSON gefunden wurde, dieses als interaktive Elemente verarbeiten
    if json_match:
        try:
            json_str = json_match.group(1)
            data = json.loads(json_str)
            
            # Überprüfen, ob das JSON valide BotComponentResponse-Elemente enthält
            if isinstance(data, dict) and "components" in data and isinstance(data["components"], list):
                components = data["components"]
                
                # Components auf valides Format prüfen
                valid_components = []
                for component in components:
                    if isinstance(component, dict) and "type" in component:
                        # Component validieren und zur Liste hinzufügen
                        valid_components.append(component)
                
                # Text bereinigen (JSON entfernen)
                clean_text = response.replace(json_match.group(0), "").strip()
                
                # Ergebnis aufbauen
                result["text"] = clean_text
                result["interactive_elements"] = valid_components
        except json.JSONDecodeError:
            # Bei ungültigem JSON-Format einfach den Originaltext zurückgeben
            logging.error(f"Ungültiges JSON-Format: {json_match.group(1)}")
    
    return result


@router.post("/completion", response_model=None)
async def chat_completion(
    request: Request,
    query: ChatQuery,
    tenant_id: str = Depends(get_tenant_id_from_query),
    user_id: str = Depends(get_user_id_from_query)
):
    """
    Generiert eine Chat-Antwort basierend auf vorherigen Nachrichten und einer Benutzeranfrage.
    Kann Streaming-Antworten zurückgeben, wenn stream=True gesetzt ist.
    """
    # Log für Debugging
    print(f"[chat_completion] Tenant-ID: {tenant_id}")
    
    # Wenn streaming angefordert wurde, den streaming Endpunkt aufrufen
    if query.stream:
        return await chat_completion_stream(request, query, tenant_id, user_id)
    
    # Nicht-Streaming-Logik für normale Anfragen
    use_mistral = query.use_mistral if hasattr(query, 'use_mistral') else False
    
    full_response = ""
    async for chunk in rag_service.process_chat(
        tenant_id=tenant_id,
        messages=[{"role": msg.role, "content": msg.content} for msg in query.messages],
        system_prompt=query.custom_instructions,
        stream=False,
        use_mistral=use_mistral
    ):
        full_response += chunk
    
    # Verarbeiten der Antwort für UI-Komponenten und strukturierte Daten
    processed_response = await process_bot_response(full_response)
    
    if len(full_response) < 5:
        # Leere oder zu kurze Antwort signalisiert oft ein Problem mit dem LLM
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Die KI konnte keine Antwort generieren. Bitte versuchen Sie es erneut."
        )
    
    # Tracking für nicht-Stream-Anfragen - deaktiviert, da chat_log_service fehlt
    # if user_id:
    #     chat_log_service.log_chat(
    #         tenant_id=tenant_id, 
    #         user_id=user_id, 
    #         query=query.messages[-1].content if query.messages else "", 
    #         response=full_response
    #     )
    
    return processed_response


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


async def chat_completion_stream(
    request: Request,
    query: ChatQuery,
    tenant_id: str = Depends(get_tenant_id_from_query),
    user_id: str = Depends(get_user_id_from_query)
):
    """
    Generiert eine Chat-Antwort und streamt sie zurück.
    """
    # Log für Debugging
    print(f"[chat_completion_stream] Tenant-ID: {tenant_id}")
    
    use_mistral = query.use_mistral if hasattr(query, 'use_mistral') else False
    
    # Generator-Funktion für die Stream-Antwort
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
            
            # Am Ende der Antwort, überprüfen, ob strukturierte Daten vorhanden sind
            processed_response = await process_bot_response(full_response)
            
            # Prüfen auf strukturierte Daten und senden
            if "structured_data" in processed_response and processed_response["structured_data"]:
                structured_data_event = json.dumps({
                    "text": processed_response["text"],
                    "structured_data": processed_response["structured_data"]
                })
                yield f"data: {structured_data_event}\n\n"
            
            # Sende das DONE-Event als separaten Server-Sent Event, nicht als Teil des Inhalts
            yield "event: done\ndata: \n\n"
        except Exception as e:
            yield f"data: Error: {str(e)}\n\n"
            yield "event: done\ndata: \n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    ) 