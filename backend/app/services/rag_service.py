from typing import List, Dict, Any, AsyncGenerator, Optional, Union
from ..services.weaviate_service import weaviate_service
from ..services.llm_service import llm_service
from ..services.interactive.factory import interactive_factory
from ..services.structured_data_service import structured_data_service
from ..db.models import Tenant, TenantModel
from ..services.tenant_service import tenant_service
from ..services.weaviate.search_manager import SearchManager
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.core.config import settings
import json
import re
import logging
from datetime import datetime

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class RAGService:
    """
    Retrieval-Augmented Generation (RAG) Service.
    Kombiniert die Retrieval-Funktionalität von Weaviate mit der Generationsfähigkeit eines LLM.
    """
    
    def __init__(self):
        """Initialisiert den RAG-Service und seine Abhängigkeiten."""
        self.search_manager = SearchManager
        self.tenant_service = tenant_service
        self.llm_service = llm_service
    
    def _get_default_system_prompt(self, tenant: Optional[Tenant] = None) -> str:
        """
        Erzeugt einen Standard-System-Prompt basierend auf dem Tenant.
        
        Args:
            tenant: Optional[Tenant] - Der Tenant, für den der System-Prompt erzeugt werden soll.
            
        Returns:
            str - Der System-Prompt.
        """
        base_prompt = """
        Du bist ein hilfreicher Assistent, der Fragen zu den bereitgestellten Informationen beantwortet.
        Verwende NUR die Informationen aus dem Kontext, um die Frage zu beantworten.
        Es ist WICHTIG, dass du nur auf Basis der Informationen antwortest, die dir im Kontext zur Verfügung gestellt werden.
        Du sollst KEINE Informationen erfinden oder aus deinem allgemeinen Wissen ergänzen.
        
        Wenn du die Antwort nicht im Kontext findest, sage ehrlich: "Zu dieser Frage liegen mir keine Informationen vor. 
        Bitte wenden Sie sich für weitere Details direkt an die Stadtverwaltung."
        
        Gib keine Informationen preis, die nicht im Kontext enthalten sind.
        Vermeide Halluzinationen und erfundene Antworten.
        
        Wenn möglich, verweise auf relevante Online-Dienste und Angebote, die im Kontext erwähnt werden.
        """
        
        if tenant and tenant.custom_instructions:
            # Tenant-spezifische Anpassungen aus den custom_instructions hinzufügen
            base_prompt += f"\n\n{tenant.custom_instructions}"
        
        return base_prompt
    
    def format_ui_components_instructions(self, query: str, components_config) -> str:
        """
        Formatiert Anweisungen für UI-Komponenten basierend auf der Anfrage und Konfiguration.
        Verwendet nur explizit konfigurierte Layouts vom Tenant.
        """
        if not components_config or not components_config.rules:
            return ""
        
        instructions = "\n\nWICHTIG - UI-KOMPONENTEN FORMATIERUNG:\n"
        instructions += "Verwende für deine Antwort die folgenden spezifischen Layoutvorgaben:\n"
        
        # Standard-Komponenten und Beispielformate laden
        from ..db.session import get_db
        from ..db.models import UIComponentDefinition
        from sqlalchemy.orm import Session
        
        # Komponenten-Definitionen aus der Datenbank laden
        db = next(get_db())
        
        # Dictionary mit verfügbaren Komponenten und deren Beispielformaten erstellen
        components_examples = {}
        component_definitions = db.query(UIComponentDefinition).all()
        
        # Standardbeispiele sammeln
        for comp_def in component_definitions:
            components_examples[comp_def.name] = comp_def.example_format
        
        # Wenn die Konfiguration eigene defaultExamples hat, diese verwenden oder mit den DB-Beispielen ergänzen
        if hasattr(components_config, 'defaultExamples') and components_config.defaultExamples:
            # Mische die vorhandenen mit den benutzerdefinierten Beispielen
            for comp_name, example in components_config.defaultExamples.items():
                components_examples[comp_name] = example
        
        # Für jede aktive Regel prüfen, ob sie auf die Anfrage zutrifft
        matching_rules = []
        for rule in components_config.rules:
            if not rule.isEnabled:
                continue
            
            # Prüfen, ob einer der Trigger in der Anfrage vorkommt
            matches = False
            for trigger in rule.triggers:
                if trigger.lower() in query.lower():
                    matches = True
                    matching_rules.append(rule)
                    break
        
        # Wenn keine Regeln zutreffen, keine speziellen Anweisungen
        if not matching_rules:
            logger.info(f"Keine passenden UI-Komponenten-Regeln für die Anfrage: '{query}'")
            return ""
        
        # Ansonsten die gefundenen Regeln anwenden
        for rule in matching_rules:
            instructions += f"\n\nDie Anfrage enthält '{rule.triggers[0]}'. "
            instructions += f"Verwende die {rule.component}-Komponente für deine Antwort.\n"
            
            # Beispielformat für die Antwort - aus Regel, Konfiguration oder Standardbeispiel
            example_format = None
            
            # 1. Prüfe, ob die Regel ein eigenes Beispielformat hat
            if hasattr(rule, 'exampleFormat') and rule.exampleFormat:
                example_format = rule.exampleFormat
            # 2. Prüfe, ob es ein Standardbeispiel für diese Komponente gibt
            elif rule.component in components_examples:
                example_format = components_examples[rule.component]
            # 3. Fallback auf hartcodierte Beispiele, falls nichts gefunden wurde
            else:
                # Bekannte Komponenten mit Standardbeispielen
                if rule.component == "OpeningHoursTable":
                    example_format = """
```json
{
  "text": "Hier sind die Öffnungszeiten:",
  "component": "OpeningHoursTable",
  "data": {
    "Montag": {"open": "08:00", "close": "18:00"},
    "Dienstag": {"open": "08:00", "close": "18:00"},
    "Mittwoch": {"open": "08:00", "close": "18:00"},
    "Donnerstag": {"open": "08:00", "close": "18:00"},
    "Freitag": {"open": "08:00", "close": "16:00"},
    "Samstag": {"closed": true},
    "Sonntag": {"closed": true}
  }
}
```
"""
                elif rule.component == "StoreMap":
                    example_format = """
```json
{
  "text": "Hier ist eine Übersicht unserer Standorte:",
  "component": "StoreMap",
  "data": {
    "title": "Unsere Standorte",
    "locations": [
      {
        "id": "loc1",
        "name": "Hauptstelle",
        "description": "Zentrale",
        "floor": "EG",
        "category": "Verwaltung"
      }
    ]
  }
}
```
"""
                elif rule.component == "ProductShowcase":
                    example_format = """
```json
{
  "text": "Hier sind unsere aktuellen Angebote:",
  "component": "ProductShowcase",
  "data": {
    "title": "Aktuelle Angebote",
    "products": [
      {
        "id": "prod1",
        "name": "Produkt 1",
        "description": "Beschreibung des Produkts",
        "price": "19,99 €",
        "imageUrl": "https://example.com/image.jpg"
      }
    ]
  }
}
```
"""
                elif rule.component == "ContactCard":
                    example_format = """
```json
{
  "text": "Hier sind unsere Kontaktinformationen:",
  "component": "ContactCard",
  "data": {
    "title": "Kontaktdaten",
    "contacts": [
      {
        "id": "contact1",
        "name": "Kundenservice",
        "email": "info@example.com",
        "phone": "+49 123 456789"
      }
    ]
  }
}
```
"""
            
            # Beispielformat zur Anleitung hinzufügen
            if example_format:
                instructions += "\nDeine Antwort MUSS folgendes Format haben:\n"
                instructions += example_format
        
        return instructions
    
    def format_structured_data_instructions(self, query: str) -> str:
        """
        Formatiert Anweisungen für strukturierte Daten basierend auf der Anfrage.
        Gibt Hinweise, wie strukturierte Daten im Response-Format zu integrieren sind.
        """
        structured_data_types = {
            'school': ['schule', 'grundschule', 'gesamtschule', 'gymnasium', 'oberschule', 'schulen', 'bildung', 'bildungseinrichtung'],
            'office': ['amt', 'ämter', 'behörde', 'verwaltung', 'bürgeramt', 'bürgerbüro', 'rathaus', 'verwaltungsstelle', 'bürgerdienst'],
            'event': ['veranstaltung', 'event', 'termin', 'termine', 'veranstaltungen', 'events', 'festival', 'konzert', 'messe'],
            'service': ['dienstleistung', 'service', 'dienst', 'angebot', 'servicebereich', 'serviceangebot'],
            'local_law': ['ortsrecht', 'satzung', 'verordnung', 'rechtsvorschrift', 'kommunalrecht', 'recht', 'gesetz', 'regelung'],
            'kindergarten': ['kita', 'kindergarten', 'krippe', 'kinderbetreuung', 'tagespflege', 'vorschule'],
            'webpage': ['webseite', 'homepage', 'internetseite', 'website', 'online', 'portal'],
            'waste_management': ['abfall', 'müll', 'entsorgung', 'wertstoff', 'recycling', 'mülltrennung', 'abfallentsorgung']
        }
        
        # Anfrage auf Kleinbuchstaben normalisieren für die Erkennung
        query_lower = query.lower()
        
        # Prüfen, ob die Anfrage nach strukturierten Daten fragt
        detected_types = []
        for data_type, keywords in structured_data_types.items():
            for keyword in keywords:
                if keyword in query_lower:
                    detected_types.append(data_type)
                    break
        
        # Wenn keine strukturierten Daten in der Anfrage erkannt wurden, leere Anweisungen zurückgeben
        if not detected_types:
            return ""
        
        # Anweisungen für strukturierte Daten formatieren
        instructions = "\n\nWICHTIG - STRUKTURIERTE DATEN FORMATIERUNG:\n"
        instructions += "Wenn deine Antwort strukturierte Informationen enthält (z.B. zu Schulen, Ämtern oder Veranstaltungen), "
        instructions += "solltest du diese in einem speziellen Format zurückgeben:\n\n"
        instructions += "1. Antworte normal im Text auf die Frage.\n"
        instructions += "2. Wenn du strukturierte Daten zurückgeben möchtest, verwende dieses Format:\n"
        instructions += "<structured_data>\n"
        instructions += "[{\"type\": \"DATENTYP\", \"data\": {OBJEKT}}, ...]\n"
        instructions += "</structured_data>\n\n"
        instructions += "Beispiel für eine Schule:\n"
        instructions += "<structured_data>\n"
        instructions += "[{\"type\": \"school\", \"data\": {\"name\": \"WIR-Grundschule\", \"address\": \"Maerckerstraße 11\"}}]\n"
        instructions += "</structured_data>\n\n"
        
        # Hinweis auf erkannte Datentypen
        instructions += f"In der aktuellen Anfrage wurden Hinweise auf folgende Datentypen erkannt: {', '.join(detected_types)}.\n"
        instructions += "Füge diese strukturierten Daten nur hinzu, wenn du tatsächlich relevante Informationen hast.\n"
        
        return instructions

    async def get_structured_data_for_query(self, tenant_id: str, query: str):
        """
        Hilfsmethode, die strukturierte Daten zu einer Query zurückgibt (für Testzwecke).
        
        Args:
            tenant_id: ID des Tenants
            query: Suchanfrage
            
        Returns:
            Dict: Ergebnisse je Datentyp
        """
        results = {}
        data_types = ["school", "office", "event", "service", "local_law", "kindergarten", "webpage", "waste_management"]
        
        for data_type in data_types:
            try:
                type_results = structured_data_service.search_structured_data(
                    tenant_id=tenant_id,
                    query=query,
                    data_type=data_type,
                    limit=5
                )
                
                if type_results:
                    results[data_type] = type_results
                    logger.info(f"{len(type_results)} {data_type} gefunden für Query '{query}'")
            except Exception as e:
                logger.error(f"Fehler beim Suchen nach {data_type}: {e}")
        
        return results

    async def get_answer(
        self, 
        query: str, 
        tenant_id: str,
        db: Session,
        top_k: int = 5,
        use_structured_data: bool = True
    ):
        """
        Generiert eine Antwort auf eine Frage basierend auf den abgerufenen Dokumenten und ggf. strukturierten Daten.
        
        Args:
            query: Die Frage des Benutzers
            tenant_id: Die ID des Tenants
            db: Die Datenbankverbindung
            top_k: Anzahl der Dokumente, die abgerufen werden sollen
            use_structured_data: Ob strukturierte Daten für die Antwort verwendet werden sollen
            
        Returns:
            str: Die generierte Antwort
        """
        try:
            # Tenant-Informationen abrufen
            tenant = tenant_service.get_tenant_by_id(db, tenant_id)
            if not tenant:
                logger.error(f"Tenant mit ID {tenant_id} nicht gefunden")
                return "Fehler: Tenant nicht gefunden"
                
            # Tenant-Name für die Antwort
            tenant_name = tenant.name
            
            # Dokumente basierend auf der Frage abrufen
            logger.info(f"Suche Dokumente für Query: '{query}', Tenant: {tenant_id}")
            docs = self.search_manager.search(tenant_id, query, top_k=top_k)
            
            if docs:
                logger.info(f"{len(docs)} Dokumente gefunden")
                logger.info(f"Top-Dokument: {docs[0].get('title', 'Kein Titel')}")
            else:
                logger.info("Keine Dokumente gefunden")
                
            # Prüfen, ob strukturierte Daten verwendet werden sollen
            structured_data_results = []
            if use_structured_data:
                # Strukturierte Daten für verschiedene Datentypen abfragen
                data_types = ["school", "office", "event", "service", "local_law", "kindergarten", "webpage", "waste_management"]
                
                # Für jeden Datentyp nach strukturierten Daten suchen
                for data_type in data_types:
                    try:
                        type_results = structured_data_service.search_structured_data(
                            tenant_id=tenant_id,
                            query=query,
                            data_type=data_type,
                            limit=3  # Begrenzt auf 3 Ergebnisse pro Typ
                        )
                        
                        if type_results:
                            logger.info(f"{len(type_results)} strukturierte Daten vom Typ '{data_type}' gefunden")
                            structured_data_results.extend(type_results)
                    except Exception as e:
                        logger.error(f"Fehler beim Abrufen von strukturierten Daten vom Typ '{data_type}': {e}")
                
                if structured_data_results:
                    logger.info(f"Insgesamt {len(structured_data_results)} strukturierte Daten gefunden")
                else:
                    logger.info("Keine strukturierten Daten gefunden")
            
            # Kontext für die Antwort erstellen
            context = ""
            
            # Dokumente zum Kontext hinzufügen
            if docs:
                context += "===== DOKUMENTE =====\n\n"
                for i, doc in enumerate(docs):
                    title = doc.get("title", "Kein Titel")
                    content = doc.get("content", "Kein Inhalt").strip()
                    context += f"DOKUMENT {i+1}: {title}\n{content}\n\n"
            
            # Strukturierte Daten zum Kontext hinzufügen
            if structured_data_results:
                context += "===== STRUKTURIERTE DATEN =====\n\n"
                
                for i, item in enumerate(structured_data_results):
                    data_type = item.get("type", "unknown")
                    data = item.get("data", {})
                    
                    context += f"STRUKTURIERTES DATUM {i+1} (Typ: {data_type}):\n"
                    
                    # Je nach Datentyp die strukturierten Daten formatieren
                    if data_type == "school":
                        context += f"Name: {data.get('name', '')}\n"
                        context += f"Typ: {data.get('type', '')}\n"
                        context += f"Adresse: {data.get('address', '')}\n"
                        
                        contact = data.get('contact', {})
                        if contact:
                            context += f"Telefon: {contact.get('phone', '')}\n"
                            context += f"E-Mail: {contact.get('email', '')}\n"
                            context += f"Website: {contact.get('website', '')}\n"
                            
                        context += f"Beschreibung: {data.get('description', '')}\n"
                        context += f"Link: {data.get('link', '')}\n"
                        
                    elif data_type == "office":
                        context += f"Name: {data.get('name', '')}\n"
                        context += f"Abteilung: {data.get('department', '')}\n"
                        context += f"Adresse: {data.get('address', '')}\n"
                        context += f"Öffnungszeiten: {data.get('openingHours', '')}\n"
                        
                        contact = data.get('contact', {})
                        if contact:
                            context += f"Telefon: {contact.get('phone', '')}\n"
                            context += f"E-Mail: {contact.get('email', '')}\n"
                            context += f"Website: {contact.get('website', '')}\n"
                            
                        services = data.get('services', [])
                        if services:
                            context += "Dienstleistungen:\n"
                            for service in services:
                                context += f"- {service}\n"
                                
                        context += f"Beschreibung: {data.get('description', '')}\n"
                        
                    elif data_type == "event":
                        context += f"Titel: {data.get('title', '')}\n"
                        context += f"Datum: {data.get('date', '')}\n"
                        context += f"Uhrzeit: {data.get('time', '')}\n"
                        context += f"Ort: {data.get('location', '')}\n"
                        context += f"Veranstalter: {data.get('organizer', '')}\n"
                        
                        contact = data.get('contact', {})
                        if contact:
                            context += f"Telefon: {contact.get('phone', '')}\n"
                            context += f"E-Mail: {contact.get('email', '')}\n"
                            context += f"Website: {contact.get('website', '')}\n"
                            
                        context += f"Beschreibung: {data.get('description', '')}\n"
                        context += f"Inhalt: {data.get('content', '')}\n"
                        context += f"Link: {data.get('link', '')}\n"
                        
                    else:
                        # Allgemeine Formatierung für andere Datentypen
                        for key, value in data.items():
                            if isinstance(value, dict):
                                context += f"{key}:\n"
                                for sub_key, sub_value in value.items():
                                    context += f"  {sub_key}: {sub_value}\n"
                            elif isinstance(value, list):
                                context += f"{key}:\n"
                                for item in value:
                                    context += f"  - {item}\n"
                            else:
                                context += f"{key}: {value}\n"
                    
                    context += "\n"
            
            # Prompt für die Antwortgenerierung erstellen
            prompt = f"""
Du bist ein hilfreicher Assistent für {tenant_name}. Deine Aufgabe ist es, präzise, faktisch korrekte Antworten zu geben.

FRAGE:
{query}

KONTEXT:
{context}

ANWEISUNGEN:
1. Beantworte die Frage basierend auf den Informationen im Kontext.
2. Wenn strukturierte Daten vorhanden sind (z.B. Schulen, Ämter, Veranstaltungen), priorisiere diese in deiner Antwort.
3. Füge konkrete Details ein, wie Öffnungszeiten, Adressen, Kontaktdaten, wenn diese verfügbar sind.
4. Bei Veranstaltungen, nenne Datum, Uhrzeit und Ort.
5. Wenn keine relevanten Informationen im Kontext vorhanden sind, sage ehrlich, dass du diese Information nicht hast.
6. Verwende einen freundlichen, professionellen Ton.
7. Antworte auf Deutsch, auch wenn Teile des Kontexts in einer anderen Sprache sein sollten.

ANTWORT:
"""
            
            # Antwort generieren
            temperature = 0.2  # Niedrige Temperatur für faktenbasierte Antworten
            
            response = await llm_service.generate_text(
                prompt=prompt,
                temperature=temperature,
                max_tokens=1000
            )
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Fehler beim Erstellen der Antwort: {e}")
            return f"Es ist ein Fehler bei der Beantwortung aufgetreten: {str(e)}"
    
    async def process_chat(
        self,
        tenant_id: str,
        messages: List[Dict[str, str]],
        system_prompt: Optional[str] = None,
        stream: bool = True,
        use_mistral: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Verarbeitet eine Chat-Konversation mit mehreren Nachrichten.
        Die letzte Benutzernachricht wird für die Suche verwendet.
        """
        # Finde die letzte Benutzernachricht
        query = ""
        for message in reversed(messages):
            if message["role"] == "user":
                query = message["content"]
                break
        
        if not query:
            yield "Keine gültige Benutzeranfrage gefunden."
            return
        
        try:
            # RAG-Prozess durchführen mit vereinfachtem Streaming
            if stream:
                # Bei Streaming den Generator direkt verwenden
                response_generator = await self.get_answer(
                    query=query,
                    tenant_id=tenant_id,
                    db=SessionLocal(),
                    top_k=5,
                    use_structured_data=True
                )
                
                async for chunk in response_generator:
                    if chunk:
                        yield chunk
            else:
                # Bei nicht-Streaming die komplette Antwort generieren
                response = await self.get_answer(
                    query=query,
                    tenant_id=tenant_id,
                    db=SessionLocal(),
                    top_k=5,
                    use_structured_data=True
                )
                
                if response:
                    yield response
        except Exception as e:
            # Verbesserte Fehlerbehandlung
            error_msg = str(e)
            logging.error(f"Fehler bei der Chat-Verarbeitung: {error_msg}", exc_info=True)
            yield f"Es tut mir leid, bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten: {error_msg}"


# Instanz des RAG-Service erzeugen
rag_service = RAGService() 