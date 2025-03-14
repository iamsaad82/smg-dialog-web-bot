from typing import List, Dict, Any, AsyncGenerator, Optional
from ..services.weaviate_service import weaviate_service
from ..services.llm_service import llm_service
from ..services.interactive.factory import interactive_factory
from ..services.structured_data_service import structured_data_service
from ..db.models import Tenant, TenantModel
import json
import re
import logging

logger = logging.getLogger(__name__)


class RAGService:
    """
    Retrieval-Augmented Generation (RAG) Service.
    Kombiniert die Retrieval-Funktionalität von Weaviate mit der Generationsfähigkeit eines LLM.
    """
    
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

    async def get_structured_data_for_query(self, tenant_id: str, query: str) -> List[Dict[str, Any]]:
        """
        Sucht strukturierte Daten in Weaviate, die zur Anfrage passen.
        
        Args:
            tenant_id: ID des Tenants
            query: Suchanfrage
            
        Returns:
            Liste von gefundenen strukturierten Daten-Elementen
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
        
        # Relevant detectierte Datentypen ermitteln
        detected_types = []
        for data_type, keywords in structured_data_types.items():
            for keyword in keywords:
                if keyword in query_lower:
                    detected_types.append(data_type)
                    break
        
        # Wenn keine strukturierten Daten in der Anfrage erkannt wurden, 
        # versuche trotzdem eine allgemeine Suche mit allen Datentypen
        # Das verbessert die Chancen, dass strukturierte Daten in die Antworten einfließen
        if not detected_types:
            # Versuche proaktiv mit allen Datentypen zu suchen
            logger.info("Proaktive Suche nach strukturierten Daten...")
            if tenant_id:
                try:
                    # Alle unterstützten Datentypen durchsuchen
                    all_data_types = list(structured_data_types.keys())
                    for data_type in all_data_types:
                        # Nur eine kurze Probeanfrage
                        test_results = structured_data_service.search_structured_data(
                            tenant_id=tenant_id,
                            data_type=data_type,
                            query=query,
                            limit=2  # Nur wenige Ergebnisse zur Probe
                        )
                        if test_results:
                            detected_types.append(data_type)
                            logger.info(f"Proaktiv {len(test_results)} Einträge vom Typ {data_type} gefunden")
                except Exception as e:
                    logger.error(f"Fehler bei der proaktiven Suche nach strukturierten Daten: {str(e)}")
            
        if not detected_types:
            return []
        
        results = []
        
        # Wenn spezifische Entitäten erkannt wurden, nach diesen suchen
        for data_type in detected_types:
            entity_results = structured_data_service.search_structured_data(
                tenant_id=tenant_id,
                data_type=data_type,
                query=query,
                limit=3  # Limit auf wenige, aber hochrelevante Ergebnisse
            )
            results.extend(entity_results)
        
        # Allgemeine Suche für jeden erkannten Datentyp durchführen, wenn keine spezifischen Entitäten gefunden wurden
        if not results:
            for data_type in detected_types:
                type_results = structured_data_service.search_structured_data(
                    tenant_id=tenant_id,
                    data_type=data_type,
                    query=query,
                    limit=2  # Weniger Ergebnisse für allgemeine Suche
                )
                results.extend(type_results)
        
        # Duplikate entfernen (basierend auf ID)
        unique_results = []
        seen_ids = set()
        for item in results:
            item_id = item.get('data', {}).get('id', '')
            if item_id and item_id not in seen_ids:
                seen_ids.add(item_id)
                unique_results.append(item)
        
        return unique_results[:5]  # Maximal 5 Ergebnisse zurückgeben
    
    async def generate_answer(
        self,
        tenant_id: str,
        query: str, 
        limit: int = 5,
        hybrid_search: bool = True,
        system_prompt: Optional[str] = None,
        stream: bool = True,
        use_mistral: bool = False
    ) -> AsyncGenerator[str, None]:
        """
        Führt den RAG-Prozess durch:
        1. Sucht relevante Dokumente in Weaviate
        2. Formatiert die gefundenen Dokumente als Kontext
        3. Generiert eine Antwort mit dem LLM
        """
        print(f"RAG generate_answer: Anfrage '{query}' für Tenant {tenant_id}")
        
        # Allgemeine Fragen, die keine Dokumente benötigen - vereinfachte Prüfung
        general_questions = [
            "wer bist du", "stell dich vor", "was kannst du", "wie heißt du", 
            "wer hat dich entwickelt", "wer hat dich gemacht", "was ist deine aufgabe", 
            "was machst du", "wie funktionierst du", "wofür bist du da",
            "erzähl mir über dich", "erkläre dich", "definiere dich", "identifiziere dich",
            "stelle dich vor", "beschreibe dich", "hilfe", "help"
        ]
        
        # Prüfen, ob es sich um eine allgemeine Frage über den Bot handelt (vereinfachte Prüfung)
        is_general_question = False
        query_lower = query.lower()
        for q in general_questions:
            if q in query_lower:
                is_general_question = True
                print(f"Allgemeine Frage erkannt über Stichwort: '{q}'")
                break
        
        print(f"Ist allgemeine Frage: {is_general_question}")
        
        # WICHTIG: Zuerst nach strukturierten Daten suchen
        structured_data = await self.get_structured_data_for_query(tenant_id, query)
        has_structured_data = bool(structured_data)
        
        print(f"Strukturierte Daten gefunden: {has_structured_data} (Anzahl: {len(structured_data)})")
        
        # Dann nach regulären Dokumenten suchen
        retrieved_docs = [] if is_general_question else weaviate_service.search(
            tenant_id=tenant_id,
            query=query,
            limit=limit,
            hybrid_search=hybrid_search
        )
        
        print(f"Gefundene Dokumente: {len(retrieved_docs)}")
        if retrieved_docs:
            print(f"Erster Dokumenttitel: {retrieved_docs[0].get('title', 'Kein Titel')}")
            print(f"Alle gefundenen Dokumente: {[doc.get('title', 'Kein Titel') for doc in retrieved_docs]}")
        else:
            print("WARNUNG: Keine Dokumente gefunden für die Anfrage.")
        
        # Wenn keine Dokumente gefunden wurden und es keine allgemeine Frage ist
        if not retrieved_docs and not is_general_question:
            # Eine weitere Suche versuchen mit verringertem Alpha-Wert (mehr Vektorgewichtung)
            print("Versuche erneute Suche mit angepassten Parametern...")
            retrieved_docs = weaviate_service.search(
                tenant_id=tenant_id,
                query=query,
                limit=limit + 5,  # Erhöhtes Limit
                hybrid_search=True
            )
            
            print(f"Zweiter Versuch - Gefundene Dokumente: {len(retrieved_docs)}")
            if retrieved_docs:
                print(f"Zweiter Versuch - Erster Dokumenttitel: {retrieved_docs[0].get('title', 'Kein Titel')}")
                print(f"Zweiter Versuch - Alle gefundenen Dokumente: {[doc.get('title', 'Kein Titel') for doc in retrieved_docs]}")
        
        # Wenn weder Dokumente noch strukturierte Daten gefunden wurden und es keine allgemeine Frage ist
        if not retrieved_docs and not has_structured_data and not is_general_question:
            # Gib eine Standardantwort zurück
            print("FEHLER: Weder Dokumente noch strukturierte Daten gefunden und keine allgemeine Frage")
            yield "Ich konnte leider keine relevanten Informationen zu Ihrer Anfrage finden. Könnte ich Ihnen mit etwas anderem helfen?"
            return
        
        # 2. Kontext formatieren (leerer Kontext für allgemeine Fragen)
        context = "" if is_general_question else llm_service.format_retrieved_documents(retrieved_docs)
        
        # 3. Antwort generieren - vereinfachtes Streaming
        try:
            # System-Prompt generieren
            system_prompt_text = await llm_service.generate_system_prompt(tenant_id, system_prompt)
            
            # UI-Komponenten-Anweisungen hinzufügen
            from ..services.tenant_service import tenant_service
            from sqlalchemy.orm import Session
            from ..db.session import get_db
            
            # DB-Session holen
            db = next(get_db())
            
            # UI-Komponenten-Konfiguration abrufen
            ui_config = tenant_service.get_ui_components_config(db, tenant_id)
            
            # NUR tenant-spezifische Komponenten-Konfiguration laden und Anweisungen generieren
            # Keine generischen UI-Komponenten mehr, wenn nicht explizit konfiguriert
            tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
            
            if tenant and tenant.ui_components_config:
                try:
                    # Verwende die vom Tenant konfigurierte UI-Komponenten-Konfiguration
                    ui_instructions = self.format_ui_components_instructions(query, ui_config)
                    if ui_instructions:
                        system_prompt_text += ui_instructions
                        logger.info(f"Tenant-spezifische UI-Anweisungen für {tenant_id} hinzugefügt")
                except Exception as e:
                    logger.error(f"Fehler beim Verarbeiten der UI-Komponenten-Konfiguration: {str(e)}")
            else:
                # Keine UI-Komponenten, wenn nicht explizit konfiguriert
                logger.info(f"Keine UI-Komponenten-Konfiguration für Tenant {tenant_id} gefunden - verwende reinen Text")
            
            # Strukturierte Daten bereits gefunden, jetzt nur noch Anweisungen hinzufügen
            structured_data_instructions = ""
            
            if structured_data:
                print(f"Gefundene strukturierte Daten: {len(structured_data)}")
                structured_data_instructions = self.format_structured_data_instructions(query)
                
                # Kontext mit strukturierten Daten erweitern
                context += "\n\nStrukturierte Daten:\n"
                for item in structured_data:
                    data_type = item.get("type", "unknown")
                    data = item.get("data", {})
                    
                    if data_type == "school":
                        context += f"--- Schule: {data.get('name', 'Unbekannt')} ---\n"
                        context += f"Typ: {data.get('type', 'Unbekannt')}\n"
                        context += f"Adresse: {data.get('address', 'Unbekannt')}\n"
                        if "contact" in data:
                            contact = data["contact"]
                            context += f"Kontakt: Tel: {contact.get('phone', '-')}, E-Mail: {contact.get('email', '-')}, Website: {contact.get('website', '-')}\n"
                        context += f"Weitere Infos: {data.get('additionalInfo', '-')}\n"
                        context += f"Beschreibung: {data.get('description', '-')}\n"
                    
                    elif data_type == "office":
                        context += f"--- Amt/Behörde: {data.get('name', 'Unbekannt')} ---\n"
                        context += f"Abteilung: {data.get('department', '-')}\n"
                        context += f"Adresse: {data.get('address', 'Unbekannt')}\n"
                        context += f"Öffnungszeiten: {data.get('openingHours', '-')}\n"
                        if "contact" in data:
                            contact = data["contact"]
                            context += f"Kontakt: Tel: {contact.get('phone', '-')}, E-Mail: {contact.get('email', '-')}, Website: {contact.get('website', '-')}\n"
                        if "services" in data and data["services"]:
                            context += f"Angebotene Dienstleistungen: {', '.join(data['services'])}\n"
                        context += f"Beschreibung: {data.get('description', '-')}\n"
                    
                    elif data_type == "event":
                        context += f"--- Veranstaltung: {data.get('title', 'Unbekannt')} ---\n"
                        context += f"Datum: {data.get('date', '-')}\n"
                        context += f"Uhrzeit: {data.get('time', '-')}\n"
                        context += f"Ort: {data.get('location', '-')}\n"
                        context += f"Veranstalter: {data.get('organizer', '-')}\n"
                        if "contact" in data:
                            contact = data["contact"]
                            context += f"Kontakt: Tel: {contact.get('phone', '-')}, E-Mail: {contact.get('email', '-')}, Website: {contact.get('website', '-')}\n"
                        context += f"Beschreibung: {data.get('description', '-')}\n"
                        context += f"Inhalt: {data.get('content', '-')}\n"
                    
                    elif data_type == "service":
                        context += f"--- Dienstleistung: {data.get('name', 'Unbekannt')} ---\n"
                        context += f"Kostenpflichtig: {data.get('kostenpflichtig', False)}\n"
                        context += f"Online verfügbar: {data.get('onlinedienst', False)}\n"
                        context += f"Zuständiges Amt: {data.get('amt', '-')}\n"
                        context += f"Beschreibung: {data.get('beschreibung', '-')}\n"
                        context += f"Link: {data.get('link', '-')}\n"
                    
                    elif data_type == "local_law":
                        context += f"--- Ortsrecht/Satzung: {data.get('title', 'Unbekannt')} ---\n"
                        context += f"Beschreibung: {data.get('beschreibung', '-')}\n"
                        context += f"Inhalt: {data.get('text', '-')}\n"
                        context += f"Link: {data.get('link', '-')}\n"
                    
                    elif data_type == "kindergarten":
                        context += f"--- Kindergarten/Kita: {data.get('name', 'Unbekannt')} ---\n"
                        context += f"Adresse: {data.get('address', '-')}\n"
                        context += f"Öffnungszeiten: {data.get('openingHours', '-')}\n"
                        if "contact" in data:
                            contact = data["contact"]
                            context += f"Kontakt: Tel: {contact.get('phone', '-')}, E-Mail: {contact.get('email', '-')}, Website: {contact.get('website', '-')}\n"
                        context += f"Link: {data.get('link', '-')}\n"
                    
                    elif data_type == "webpage":
                        context += f"--- Webseite: {data.get('title', 'Unbekannt')} ---\n"
                        context += f"URL: {data.get('url', '-')}\n"
                        context += f"Inhalt: {data.get('content', '-')}\n"
                    
                    elif data_type == "waste_management":
                        context += f"--- Abfallentsorgung: {data.get('name', 'Unbekannt')} ---\n"
                        context += f"Beschreibung: {data.get('description', '-')}\n"
                        context += f"Inhalt: {data.get('content', '-')}\n"
                    
                    else:
                        # Generische Darstellung für unbekannte Typen
                        context += f"--- {data_type.capitalize()}: {data.get('name', data.get('title', 'Unbekannt'))} ---\n"
                        for key, value in data.items():
                            if key not in ['id', 'name', 'title'] and not isinstance(value, dict) and not isinstance(value, list):
                                context += f"{key}: {value}\n"
                    
                    context += "\n"
            
            # Füge die Anweisungen zum System-Prompt hinzu, wenn noch nicht getan
            if structured_data_instructions and structured_data_instructions not in system_prompt_text:
                system_prompt_text += structured_data_instructions
            
            # LLM mit Kontext, System-Prompt und UI-Komponenten-Anweisungen aufrufen
            print(f"Übergebe Anfrage an LLM mit {len(context.split())} Wörtern Kontext")
            
            if stream:
                # Direkt jeden Chunk weitergeben, ohne Akkumulation
                async for chunk in llm_service.generate_response(
                    query=query,
                    context=context,
                    system_prompt=system_prompt_text,
                    stream=True,
                    use_mistral=use_mistral
                ):
                    yield chunk
            else:
                # Bei nicht-streaming Antworten sammeln wir den gesamten Text
                full_response = ""
                async for chunk in llm_service.generate_response(
                    query=query,
                    context=context,
                    system_prompt=system_prompt_text,
                    stream=False,
                    use_mistral=use_mistral
                ):
                    full_response += chunk
                
                # Gesamte Antwort auf einmal zurückgeben
                yield full_response
                
                # Interaktive Elemente extrahieren und zurückgeben
                doc_texts = [doc.get("content", "") for doc in retrieved_docs]
                interactive_elements = interactive_factory.extract_interactive_elements(
                    tenant_id=tenant_id,
                    query=query,
                    doc_texts=doc_texts
                )
                
                if interactive_elements:
                    # Interaktive Elemente als JSON-String codieren
                    elements_json = [element.to_json() for element in interactive_elements]
                    yield f"\n\n<!-- INTERACTIVE_ELEMENTS: {json.dumps(elements_json)} -->"
        except Exception as e:
            # Fehlerbehandlung verbessern
            print(f"Fehler bei der Antwortgenerierung: {str(e)}")
            yield f"Es tut mir leid, bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten: {str(e)}"
    
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
            async for chunk in self.generate_answer(
                tenant_id=tenant_id,
                query=query,
                system_prompt=system_prompt,
                stream=stream,
                use_mistral=use_mistral
            ):
                yield chunk
        except Exception as e:
            # Verbesserte Fehlerbehandlung
            print(f"Fehler bei der Chat-Verarbeitung: {str(e)}")
            yield f"Es tut mir leid, bei der Verarbeitung Ihrer Anfrage ist ein Fehler aufgetreten: {str(e)}"


# Singleton-Instanz des Services
rag_service = RAGService() 