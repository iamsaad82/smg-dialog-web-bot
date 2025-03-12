import openai
import json
import httpx
import asyncio
from typing import List, Dict, Any, AsyncGenerator, Optional
from ..core.config import settings


class LLMService:
    """
    Service für die Interaktion mit Large Language Models.
    Unterstützt GPT-4 von OpenAI oder Mistral mit Streaming-Unterstützung.
    """
    
    def __init__(self):
        """Initialisiert den LLM-Service mit den entsprechenden API-Keys."""
        # OpenAI-Setup
        self.openai_api_key = settings.OPENAI_API_KEY
        self.openai_model = settings.OPENAI_MODEL
        
        # OpenAI-Client initialisieren
        self.client = openai.AsyncOpenAI(api_key=self.openai_api_key)
        
        # Mistral-Setup (optional)
        self.mistral_api_key = settings.MISTRAL_API_KEY
        self.mistral_model = settings.MISTRAL_MODEL
        
        # Standard-System-Prompt
        self.default_system_prompt = """
        Du bist ein hilfreicher Assistent, der Fragen zu den bereitgestellten Informationen beantwortet.
        Verwende nur die Informationen aus dem Kontext, um die Frage zu beantworten.
        Wenn du die Antwort nicht im Kontext findest, sage ehrlich, dass du es nicht weißt.
        Gib keine Informationen preis, die nicht im Kontext enthalten sind.
        Vermeide Halluzinationen und erfundene Antworten.
        """
    
    def format_retrieved_documents(self, documents: List[Dict[str, Any]]) -> str:
        """Formatiert abgerufene Dokumente als Kontext für das LLM."""
        formatted_context = ""
        
        for i, doc in enumerate(documents, 1):
            title = doc.get("title", "Unbekannter Titel")
            content = doc.get("content", "")
            source = doc.get("source", "Unbekannt")
            
            formatted_context += f"--- Dokument {i}: {title} ---\n"
            formatted_context += f"{content}\n"
            formatted_context += f"Quelle: {source}\n\n"
        
        return formatted_context
    
    async def buffer_chunks_to_words(self, generator):
        """
        Sammelt Chunks vom Generator und gibt sie nur aus, wenn ein vollständiges Wort vorliegt.
        Vereinfachte Version für mehr Stabilität.
        """
        buffer = ""
        
        async for chunk in generator:
            # Einfach jedes Chunk direkt weitergeben, ohne komplexe Verarbeitung
            # Wir vertrauen darauf, dass das LLM vernünftige Chunks liefert
            yield chunk
    
    async def generate_response_openai(
        self, 
        query: str, 
        context: str,
        system_prompt: Optional[str] = None,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Generiert eine Antwort mit OpenAI-Modellen.
        Unterstützt Streaming für Echtzeit-Ausgabe.
        """
        messages = [
            {"role": "system", "content": system_prompt or self.default_system_prompt},
            {"role": "user", "content": f"Kontext:\n{context}\n\nFrage: {query}"}
        ]
        
        if stream:
            # Streaming-Antwort mit der neuen API
            response = await self.client.chat.completions.create(
                model=self.openai_model,
                messages=messages,
                stream=True,
                temperature=0.3,
                max_tokens=1000
            )
            
            # Direkte Verarbeitung des AsyncStream-Objekts
            buffer = ""
            word_delimiters = [" ", "\n", "\t", ",", ".", "!", "?", ";", ":", "-", ")", "(", "]", "[", "}", "{"]
            
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    buffer += content
                    
                    # Nach Wortgrenzen suchen
                    last_delimiter_pos = -1
                    for delim in word_delimiters:
                        pos = buffer.rfind(delim)
                        if pos > last_delimiter_pos:
                            last_delimiter_pos = pos
                    
                    # Wenn wir ein vollständiges Wort haben, geben wir es aus
                    if last_delimiter_pos >= 0:
                        yield buffer[:last_delimiter_pos + 1]
                        buffer = buffer[last_delimiter_pos + 1:]
            
            # Rest am Ende ausgeben
            if buffer:
                yield buffer
        else:
            # Nicht-Streaming-Antwort mit der neuen API
            response = await self.client.chat.completions.create(
                model=self.openai_model,
                messages=messages,
                stream=False,
                temperature=0.3,
                max_tokens=1000
            )
            
            content = response.choices[0].message.content
            yield content
    
    async def generate_response_mistral(
        self, 
        query: str, 
        context: str,
        system_prompt: Optional[str] = None,
        stream: bool = True
    ) -> AsyncGenerator[str, None]:
        """
        Generiert eine Antwort mit Mistral-Modellen.
        Unterstützt Streaming für Echtzeit-Ausgabe.
        """
        api_url = "https://api.mistral.ai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.mistral_api_key}",
            "Content-Type": "application/json"
        }
        
        messages = [
            {"role": "system", "content": system_prompt or self.default_system_prompt},
            {"role": "user", "content": f"Kontext:\n{context}\n\nFrage: {query}"}
        ]
        
        payload = {
            "model": self.mistral_model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 1000,
            "stream": stream
        }
        
        async with httpx.AsyncClient() as client:
            if stream:
                # Streaming-Antwort
                async with client.stream(
                    "POST", 
                    api_url, 
                    headers=headers, 
                    json=payload, 
                    timeout=60.0
                ) as response:
                    response.raise_for_status()
                    
                    # Direkte Verarbeitung des Streams
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if line.startswith("data: ") and not line.endswith("[DONE]"):
                            try:
                                data = json.loads(line[6:])
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                            except json.JSONDecodeError:
                                continue
            else:
                # Nicht-Streaming-Antwort
                response = await client.post(
                    api_url, 
                    headers=headers, 
                    json=payload, 
                    timeout=60.0
                )
                response.raise_for_status()
                
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                yield content
    
    async def generate_response(
        self, 
        query: str, 
        context: str,
        system_prompt: Optional[str] = None,
        stream: bool = True,
        use_mistral: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Generiert eine Antwort mit dem ausgewählten LLM.
        Standardmäßig wird OpenAI verwendet, kann aber auf Mistral umgestellt werden.
        """
        if use_mistral and self.mistral_api_key:
            async for chunk in self.generate_response_mistral(
                query=query,
                context=context,
                system_prompt=system_prompt,
                stream=stream
            ):
                yield chunk
        else:
            async for chunk in self.generate_response_openai(
                query=query,
                context=context,
                system_prompt=system_prompt,
                stream=stream
            ):
                yield chunk
    
    async def generate_system_prompt(self, tenant_id: str, custom_instructions: Optional[str] = None) -> str:
        """
        Generiert den System-Prompt basierend auf Tenant-Konfiguration und benutzerdefinierten Anweisungen.
        """
        system_prompt = self.default_system_prompt
        
        try:
            from ..services.tenant_service import tenant_service
            from sqlalchemy.orm import Session
            from ..db.session import get_db
            
            # DB-Session holen
            db = next(get_db())
            
            # UI-Komponenten-Konfiguration abrufen
            ui_config = tenant_service.get_ui_components_config(db, tenant_id)
            
            # Wenn UI-Komponenten-Konfiguration vorhanden, dem System-Prompt hinzufügen
            if ui_config and ui_config.prompt:
                system_prompt += "\n\n" + ui_config.prompt
            
            # Benutzerdefinierte Anweisungen hinzufügen, wenn vorhanden
            if custom_instructions:
                system_prompt += "\n\n" + custom_instructions
            
        except Exception as e:
            # Fehler beim Abrufen der Tenant-Konfiguration protokollieren
            print(f"Fehler beim Abrufen der Tenant-Konfiguration: {str(e)}")
        
        return system_prompt


# Singleton-Instanz des Services
llm_service = LLMService() 