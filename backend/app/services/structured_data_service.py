"""
Service zur Verwaltung strukturierter Daten aus verschiedenen Quellen.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional, List, Union
import weaviate
from datetime import datetime
from .xml_parser_service import BrandenburgXMLParser
from .weaviate.client import weaviate_client
from .weaviate.schema_manager import SchemaManager
from .weaviate import WeaviateService, weaviate_service

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StructuredDataService:
    """
    Service für strukturierte Daten.
    Ermöglicht das Importieren, Speichern und Abrufen von strukturierten Daten.
    """
    
    # Unterstützte Datentypen
    SUPPORTED_TYPES = [
        "school", "office", "event", 
        "service", "local_law", "kindergarten", "webpage", "waste_management"
    ]
    
    # Mapping von XML-Namen zu Weaviate-Typen
    TYPE_MAPPING = {
        "schools": "school",
        "offices": "office",
        "events": "event",
        "dienstleistungen": "service",
        "ortsrecht": "local_law",
        "kitas": "kindergarten",
        "webseiten": "webpage",
        "entsorgungen": "waste_management"
    }
    
    def __init__(self, weaviate_service: WeaviateService):
        """
        Initialisiert den Service.
        
        Args:
            weaviate_service: Der WeaviateService.
        """
        self.weaviate_service = weaviate_service
        # Unterstützte Datentypen von der Klassenvariable übernehmen
        self.supported_data_types = self.SUPPORTED_TYPES
    
    # Weaviate-Klassenpräfix für strukturierte Daten
    STRUCTURED_CLASS_PREFIX = "StructuredData"
    
    @staticmethod
    def get_class_name(tenant_id: str, data_type: str) -> str:
        """Generiert einen Weaviate-Klassennamen für strukturierte Daten eines Tenants."""
        tenant_name = SchemaManager.get_tenant_class_name(tenant_id).replace("Tenant", "")
        return f"{StructuredDataService.STRUCTURED_CLASS_PREFIX}{tenant_name}{data_type.capitalize()}"
    
    @staticmethod
    def create_schema_for_type(tenant_id: str, data_type: str) -> bool:
        """Erstellt das Weaviate-Schema für einen bestimmten Datentyp."""
        if not weaviate_client:
            logger.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        if data_type not in StructuredDataService.SUPPORTED_TYPES:
            logger.error(f"Nicht unterstützter Datentyp: {data_type}")
            return False
            
        class_name = StructuredDataService.get_class_name(tenant_id, data_type)
        
        # Prüfen, ob Klasse bereits existiert
        if SchemaManager.class_exists(class_name):
            return True
        
        # Eigenschaften basierend auf dem Datentyp definieren
        properties = []
        
        if data_type == "school":
            properties = [
                {"name": "name", "data_type": ["text"]},
                {"name": "type", "data_type": ["text"]},
                {"name": "schoolId", "data_type": ["text"]},
                {"name": "address", "data_type": ["text"]},
                {"name": "management", "data_type": ["text"]},
                {"name": "contactPhone", "data_type": ["text"]},
                {"name": "contactEmail", "data_type": ["text"]},
                {"name": "contactWebsite", "data_type": ["text"]},
                {"name": "allDayCare", "data_type": ["boolean"]},
                {"name": "additionalInfo", "data_type": ["text"]},
                {"name": "description", "data_type": ["text"]},
                {"name": "link", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        elif data_type == "office":
            properties = [
                {"name": "name", "data_type": ["text"]},
                {"name": "department", "data_type": ["text"]},
                {"name": "address", "data_type": ["text"]},
                {"name": "openingHours", "data_type": ["text"]},
                {"name": "contactPhone", "data_type": ["text"]},
                {"name": "contactEmail", "data_type": ["text"]},
                {"name": "contactWebsite", "data_type": ["text"]},
                {"name": "services", "data_type": ["text[]"]},
                {"name": "description", "data_type": ["text"]},
                {"name": "content", "data_type": ["text"]},
                {"name": "link", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        elif data_type == "event":
            properties = [
                {"name": "title", "data_type": ["text"]},
                {"name": "date", "data_type": ["text"]},
                {"name": "time", "data_type": ["text"]},
                {"name": "location", "data_type": ["text"]},
                {"name": "description", "data_type": ["text"]},
                {"name": "content", "data_type": ["text"]},
                {"name": "organizer", "data_type": ["text"]},
                {"name": "contactPhone", "data_type": ["text"]},
                {"name": "contactEmail", "data_type": ["text"]},
                {"name": "contactWebsite", "data_type": ["text"]},
                {"name": "link", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        elif data_type == "service":
            properties = [
                {"name": "name", "data_type": ["text"]},
                {"name": "description", "data_type": ["text"]},
                {"name": "content", "data_type": ["text"]},
                {"name": "link", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        elif data_type == "local_law":
            properties = [
                {"name": "title", "data_type": ["text"]},
                {"name": "description", "data_type": ["text"]},
                {"name": "content", "data_type": ["text"]},
                {"name": "link", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        elif data_type == "kindergarten":
            properties = [
                {"name": "name", "data_type": ["text"]},
                {"name": "address", "data_type": ["text"]},
                {"name": "contact", "data_type": ["text"]},
                {"name": "description", "data_type": ["text"]},
                {"name": "link", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        elif data_type == "webpage":
            properties = [
                {"name": "title", "data_type": ["text"]},
                {"name": "url", "data_type": ["text"]},
                {"name": "content", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        elif data_type == "waste_management":
            properties = [
                {"name": "name", "data_type": ["text"]},
                {"name": "description", "data_type": ["text"]},
                {"name": "content", "data_type": ["text"]},
                # Suchfeld für alle Inhalte
                {"name": "fullTextSearch", "data_type": ["text"]}
            ]
        
        try:
            # Schema erstellen mit Weaviate v4 API
            weaviate_client.collections.create(
                name=class_name,
                description=f"Strukturierte {data_type.capitalize()}-Daten für Tenant {tenant_id}",
                properties=properties,
                vectorizer_config={"vectorizer": "text2vec-transformers"}
            )
            
            logger.info(f"Schema für {data_type}-Daten von Tenant {tenant_id} erstellt")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Erstellen des Schemas für {data_type}: {e}")
            return False
    
    @staticmethod
    def flatten_data(data: Dict[str, Any], prefix: str = "") -> Dict[str, Any]:
        """Flacht ein verschachteltes Dictionary für Weaviate ab."""
        result = {}
        
        for key, value in data.items():
            if isinstance(value, dict):
                # Verschachtelte Dictionaries abflachen (z.B. für 'contact')
                nested = StructuredDataService.flatten_data(value, f"{prefix}{key}_")
                result.update(nested)
            elif isinstance(value, list) and key == "services" and all(isinstance(item, str) for item in value):
                # Services als Array behalten
                result[f"{prefix}{key}"] = value
            elif isinstance(value, list):
                # Listen in komma-getrennte Strings umwandeln
                result[f"{prefix}{key}"] = ", ".join(str(item) for item in value if item)
            else:
                # Schlüssel mit Präfix verwenden
                result[f"{prefix}{key}"] = value
        
        return result
    
    @staticmethod
    def store_structured_data(
        tenant_id: str,
        data_type: str,
        data: Dict[str, Any]
    ) -> Optional[str]:
        """Speichert strukturierte Daten in Weaviate."""
        if not weaviate_client:
            logger.error("Weaviate-Client ist nicht initialisiert")
            return None
            
        if data_type not in StructuredDataService.SUPPORTED_TYPES:
            logger.error(f"Nicht unterstützter Datentyp: {data_type}")
            return None
            
        class_name = StructuredDataService.get_class_name(tenant_id, data_type)
        
        # Sicherstellen, dass das Schema existiert
        if not SchemaManager.class_exists(class_name):
            if not StructuredDataService.create_schema_for_type(tenant_id, data_type):
                logger.error(f"Konnte Schema für {data_type} nicht erstellen")
                return None
        
        # UUID erstellen
        data_id = str(uuid.uuid4())
        
        # Daten für Weaviate vorbereiten (abflachen)
        flattened_data = StructuredDataService.flatten_data(data)
        
        # Volltextsuchfeld erstellen
        flattened_data["fullTextSearch"] = " ".join(str(value) for value in flattened_data.values() if value)
        
        try:
            # Daten speichern mit Weaviate v4 API
            collection = weaviate_client.collections.get(class_name)
            collection.data.insert(
                properties=flattened_data,
                uuid=data_id
            )
            logger.info(f"{data_type.capitalize()}-Daten mit ID {data_id} zu Tenant {tenant_id} hinzugefügt")
            return data_id
        except Exception as e:
            logger.error(f"Fehler beim Speichern von {data_type}-Daten: {e}")
            return None
    
    def import_brandenburg_data(self, xml_file_path: str, tenant_id: str) -> Dict[str, int]:
        """
        Importiert Brandenburg-Daten aus einer XML-Datei und speichert sie in Weaviate.
        
        Args:
            xml_file_path: Pfad zur XML-Datei.
            tenant_id: ID des Tenants, zu dem die Daten gehören.
            
        Returns:
            Dict[str, int]: Dictionary mit Anzahl der importierten Elemente pro Typ
        """
        parser = BrandenburgXMLParser(xml_file_path)
        try:
            parser.parse_file()
        except Exception as e:
            logger.error(f"Fehler beim Parsen der XML-Datei: {str(e)}")
            return {"schools": 0, "offices": 0, "events": 0, "dienstleistungen": 0, "ortsrecht": 0, "kitas": 0, "webseiten": 0, "entsorgungen": 0}
        
        # Vor dem Import alle Schemas erstellen, um sicherzustellen, dass sie existieren
        for data_type in self.SUPPORTED_TYPES:
            self.create_schema_for_type(tenant_id, data_type)
            
        result = {
            "schools": 0, 
            "offices": 0, 
            "events": 0,
            "dienstleistungen": 0,
            "ortsrecht": 0,
            "kitas": 0,
            "webseiten": 0,
            "entsorgungen": 0
        }
        
        # Schulen importieren
        schools = parser.extract_schools()
        for school in schools:
            try:
                self.store_structured_data(tenant_id, school["type"], school["data"])
                result["schools"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern einer Schule: {str(e)}")
                
        # Ämter importieren
        offices = parser.extract_offices()
        for office in offices:
            try:
                self.store_structured_data(tenant_id, office["type"], office["data"])
                result["offices"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern eines Amtes: {str(e)}")
                
        # Veranstaltungen importieren
        events = parser.extract_events()
        for event in events:
            try:
                self.store_structured_data(tenant_id, event["type"], event["data"])
                result["events"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern einer Veranstaltung: {str(e)}")
                
        # Dienstleistungen importieren
        dienstleistungen = parser.extract_dienstleistungen()
        for dienstleistung in dienstleistungen:
            try:
                self.store_structured_data(tenant_id, dienstleistung["type"], dienstleistung["data"])
                result["dienstleistungen"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern einer Dienstleistung: {str(e)}")
                
        # Ortsrecht importieren
        ortsrecht_entries = parser.extract_ortsrecht()
        for ortsrecht in ortsrecht_entries:
            try:
                self.store_structured_data(tenant_id, ortsrecht["type"], ortsrecht["data"])
                result["ortsrecht"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern eines Ortsrecht-Eintrags: {str(e)}")
                
        # Kitas importieren
        kitas = parser.extract_kitas()
        for kita in kitas:
            try:
                self.store_structured_data(tenant_id, kita["type"], kita["data"])
                result["kitas"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern einer Kita: {str(e)}")
                
        # Webseiten importieren
        webseiten = parser.extract_webseiten()
        for webseite in webseiten:
            try:
                self.store_structured_data(tenant_id, webseite["type"], webseite["data"])
                result["webseiten"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern einer Webseite: {str(e)}")
                
        # Entsorgungen importieren
        entsorgungen = parser.extract_entsorgungen()
        for entsorgung in entsorgungen:
            try:
                self.store_structured_data(tenant_id, entsorgung["type"], entsorgung["data"])
                result["entsorgungen"] += 1
            except Exception as e:
                logger.error(f"Fehler beim Speichern einer Entsorgungsmöglichkeit: {str(e)}")
        
        logger.info(f"Import für Tenant {tenant_id} abgeschlossen.")
        return result
    
    @staticmethod
    def import_brandenburg_data_from_url(url: str, tenant_id: str) -> Dict[str, int]:
        """
        Importiert strukturierte Daten für Brandenburg direkt von einer URL.
        
        Args:
            url: URL zur XML-Datei
            tenant_id: ID des Tenants
            
        Returns:
            Dict mit Anzahl der importierten Elemente pro Typ
        """
        # Sicherstellen, dass Schemas existieren
        for data_type in StructuredDataService.SUPPORTED_TYPES:
            StructuredDataService.create_schema_for_type(tenant_id, data_type)
        
        parser = BrandenburgXMLParser()
        
        if not parser.parse_file(url):
            logger.error(f"Konnte XML-Datei nicht von URL parsen: {url}")
            return {"schools": 0, "offices": 0, "events": 0, "dienstleistungen": 0, "ortsrecht": 0, "kitas": 0, "webseiten": 0, "entsorgungen": 0}
        
        # Vollständige Ergebnisliste mit allen Datentypen
        result = {
            "schools": 0, 
            "offices": 0, 
            "events": 0,
            "dienstleistungen": 0,
            "ortsrecht": 0,
            "kitas": 0,
            "webseiten": 0,
            "entsorgungen": 0
        }
        
        # Schulen importieren
        schools = parser.extract_schools()
        logger.info(f"Extrahierte {len(schools)} Schulen aus URL {url}")
        for school in schools:
            if StructuredDataService.store_structured_data(tenant_id, "school", school["data"]):
                result["schools"] += 1
        
        # Ämter importieren
        offices = parser.extract_offices()
        logger.info(f"Extrahierte {len(offices)} Ämter aus URL {url}")
        for office in offices:
            if StructuredDataService.store_structured_data(tenant_id, "office", office["data"]):
                result["offices"] += 1
        
        # Veranstaltungen importieren
        events = parser.extract_events()
        logger.info(f"Extrahierte {len(events)} Veranstaltungen aus URL {url}")
        for event in events:
            if StructuredDataService.store_structured_data(tenant_id, "event", event["data"]):
                result["events"] += 1
        
        # Dienstleistungen importieren
        dienstleistungen = parser.extract_dienstleistungen()
        logger.info(f"Extrahierte {len(dienstleistungen)} Dienstleistungen aus URL {url}")
        for dienstleistung in dienstleistungen:
            if StructuredDataService.store_structured_data(tenant_id, "service", dienstleistung["data"]):
                result["dienstleistungen"] += 1
        
        # Ortsrecht importieren
        ortsrecht_entries = parser.extract_ortsrecht()
        logger.info(f"Extrahierte {len(ortsrecht_entries)} Ortsrecht-Einträge aus URL {url}")
        for ortsrecht in ortsrecht_entries:
            if StructuredDataService.store_structured_data(tenant_id, "local_law", ortsrecht["data"]):
                result["ortsrecht"] += 1
        
        # Kitas importieren
        kitas = parser.extract_kitas()
        logger.info(f"Extrahierte {len(kitas)} Kitas aus URL {url}")
        for kita in kitas:
            if StructuredDataService.store_structured_data(tenant_id, "kindergarten", kita["data"]):
                result["kitas"] += 1
        
        # Webseiten importieren
        webseiten = parser.extract_webseiten()
        logger.info(f"Extrahierte {len(webseiten)} Webseiten aus URL {url}")
        for webseite in webseiten:
            if StructuredDataService.store_structured_data(tenant_id, "webpage", webseite["data"]):
                result["webseiten"] += 1
        
        # Entsorgungen importieren
        entsorgungen = parser.extract_entsorgungen()
        logger.info(f"Extrahierte {len(entsorgungen)} Entsorgungsmöglichkeiten aus URL {url}")
        for entsorgung in entsorgungen:
            if StructuredDataService.store_structured_data(tenant_id, "waste_management", entsorgung["data"]):
                result["entsorgungen"] += 1
        
        logger.info(f"Import von URL für Tenant {tenant_id} abgeschlossen: {result}")
        return result
    
    @staticmethod
    def search_structured_data(
        tenant_id: str,
        data_type: str,
        query: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Durchsucht strukturierte Daten in Weaviate.
        
        Args:
            tenant_id: ID des Tenants
            data_type: Typ der strukturierten Daten (school, office, event)
            query: Suchanfrage
            limit: Maximale Anzahl von Ergebnissen
            
        Returns:
            Liste von gefundenen Elementen
        """
        if not weaviate_client:
            logger.error("Weaviate-Client ist nicht initialisiert")
            return []
            
        if data_type not in StructuredDataService.SUPPORTED_TYPES:
            logger.error(f"Nicht unterstützter Datentyp: {data_type}")
            return []
            
        class_name = StructuredDataService.get_class_name(tenant_id, data_type)
        
        # Prüfen, ob Klasse existiert
        if not SchemaManager.class_exists(class_name):
            logger.error(f"Klasse {class_name} existiert nicht in Weaviate")
            return []
        
        try:
            # Suche durchführen mit Weaviate v4 API
            collection = weaviate_client.collections.get(class_name)
            # Hybrid-Suche ohne expliziten fusion_type Parameter
            results = collection.query.hybrid(
                query=query,
                limit=limit
            )
            
            # Ergebnisse in das einheitliche Format konvertieren
            formatted_results = []
            
            for item in results.objects:
                properties = item.properties
                item_id = str(item.uuid)
                
                # Properties wieder in eine verschachtelte Struktur umwandeln
                structured_data = {}
                
                # Gemeinsame Felder extrahieren
                for field in ["fullTextSearch"]:
                    if field in properties:
                        del properties[field]
                
                # Spezifische Felder je nach Datentyp verarbeiten
                if data_type == "school":
                    structured_data = {
                        "id": item_id,
                        "name": properties.get("name", ""),
                        "type": properties.get("type", ""),
                        "address": properties.get("address", ""),
                        "contact": {
                            "phone": properties.get("contact_phone", ""),
                            "email": properties.get("contact_email", ""),
                            "website": properties.get("contact_website", "")
                        },
                        "additionalInfo": properties.get("additionalInfo", ""),
                        "description": properties.get("details_description", "") or properties.get("description", ""),
                        "link": properties.get("details_link", "") or properties.get("link", "")
                    }
                
                elif data_type == "office":
                    structured_data = {
                        "id": item_id,
                        "name": properties.get("name", ""),
                        "department": properties.get("department", ""),
                        "address": properties.get("address", ""),
                        "openingHours": properties.get("openingHours", ""),
                        "contact": {
                            "phone": properties.get("contact_phone", ""),
                            "email": properties.get("contact_email", ""),
                            "website": properties.get("contact_website", "")
                        },
                        "services": properties.get("services", []),
                        "description": properties.get("description", ""),
                        "content": properties.get("details_content", "") or properties.get("content", ""),
                        "link": properties.get("details_link", "") or properties.get("link", "")
                    }
                
                elif data_type == "event":
                    structured_data = {
                        "id": item_id,
                        "title": properties.get("title", ""),
                        "date": properties.get("date", ""),
                        "time": properties.get("time", ""),
                        "location": properties.get("location", ""),
                        "description": properties.get("description", ""),
                        "content": properties.get("content", ""),
                        "organizer": properties.get("organizer", ""),
                        "contact": {
                            "phone": properties.get("contact_phone", ""),
                            "email": properties.get("contact_email", ""),
                            "website": properties.get("contact_website", "")
                        },
                        "link": properties.get("link", "")
                    }
                
                formatted_results.append({
                    "type": data_type,
                    "data": structured_data
                })
            
            logger.info(f"{len(formatted_results)} {data_type}-Elemente gefunden für Suchanfrage '{query}'")
            return formatted_results
            
        except Exception as e:
            logger.error(f"Fehler bei der Suche nach {data_type}-Daten: {e}")
            return []
    
    def _get_properties_for_data_type(self, data_type: str) -> List[Dict[str, Any]]:
        """
        Gibt die Properties für einen Datentyp zurück.
        
        Args:
            data_type: Der Datentyp.
            
        Returns:
            Die Properties für den Datentyp.
        """
        properties = []
        
        # Allgemeine Properties
        properties.extend([
            {
                "name": "tenant_id",
                "dataType": ["string"],
                "description": "ID des Tenants, zu dem die Daten gehören",
            },
            {
                "name": "type",
                "dataType": ["string"],
                "description": "Typ der strukturierten Daten",
            },
            {
                "name": "vector_id",
                "dataType": ["string"],
                "description": "Ein eindeutiger Identifikator für den Vektor",
            }
        ])
        
        # Spezifische Properties für Schulen
        if data_type == "school":
            properties.extend([
                {
                    "name": "name",
                    "dataType": ["string"],
                    "description": "Name der Schule",
                },
                {
                    "name": "type",
                    "dataType": ["string"],
                    "description": "Typ der Schule (z.B. Grundschule, Gymnasium)",
                },
                {
                    "name": "school_id",
                    "dataType": ["string"],
                    "description": "ID der Schule",
                },
                {
                    "name": "address",
                    "dataType": ["string"],
                    "description": "Adresse der Schule",
                },
                {
                    "name": "management",
                    "dataType": ["string"],
                    "description": "Schulleitung",
                },
                {
                    "name": "phone",
                    "dataType": ["string"],
                    "description": "Telefonnummer der Schule",
                },
                {
                    "name": "email",
                    "dataType": ["string"],
                    "description": "E-Mail-Adresse der Schule",
                },
                {
                    "name": "website",
                    "dataType": ["string"],
                    "description": "Website der Schule",
                },
                {
                    "name": "all_day_care",
                    "dataType": ["boolean"],
                    "description": "Gibt an, ob die Schule eine Ganztagsbetreuung anbietet",
                },
                {
                    "name": "additional_info",
                    "dataType": ["text"],
                    "description": "Zusätzliche Informationen zur Schule",
                },
            ])
        
        # Spezifische Properties für Ämter/Behörden
        elif data_type == "office":
            properties.extend([
                {
                    "name": "name",
                    "dataType": ["string"],
                    "description": "Name des Amtes/der Behörde",
                },
                {
                    "name": "department",
                    "dataType": ["string"],
                    "description": "Abteilung des Amtes/der Behörde",
                },
                {
                    "name": "address",
                    "dataType": ["string"],
                    "description": "Adresse des Amtes/der Behörde",
                },
                {
                    "name": "opening_hours",
                    "dataType": ["string"],
                    "description": "Öffnungszeiten des Amtes/der Behörde",
                },
                {
                    "name": "phone",
                    "dataType": ["string"],
                    "description": "Telefonnummer des Amtes/der Behörde",
                },
                {
                    "name": "email",
                    "dataType": ["string"],
                    "description": "E-Mail-Adresse des Amtes/der Behörde",
                },
                {
                    "name": "website",
                    "dataType": ["string"],
                    "description": "Website des Amtes/der Behörde",
                },
                {
                    "name": "services",
                    "dataType": ["string[]"],
                    "description": "Angebotene Dienstleistungen des Amtes/der Behörde",
                },
            ])
        
        # Spezifische Properties für Veranstaltungen
        elif data_type == "event":
            properties.extend([
                {
                    "name": "title",
                    "dataType": ["string"],
                    "description": "Titel der Veranstaltung",
                },
                {
                    "name": "start_date",
                    "dataType": ["date"],
                    "description": "Startdatum der Veranstaltung",
                },
                {
                    "name": "end_date",
                    "dataType": ["date"],
                    "description": "Enddatum der Veranstaltung",
                },
                {
                    "name": "location",
                    "dataType": ["string"],
                    "description": "Ort der Veranstaltung",
                },
                {
                    "name": "description",
                    "dataType": ["text"],
                    "description": "Beschreibung der Veranstaltung",
                },
                {
                    "name": "organizer",
                    "dataType": ["string"],
                    "description": "Veranstalter",
                },
                {
                    "name": "category",
                    "dataType": ["string"],
                    "description": "Kategorie der Veranstaltung",
                },
                {
                    "name": "link",
                    "dataType": ["string"],
                    "description": "Link zur Veranstaltung",
                },
            ])
            
        # Spezifische Properties für Dienstleistungen
        elif data_type == "service":
            properties.extend([
                {
                    "name": "name",
                    "dataType": ["string"],
                    "description": "Name der Dienstleistung",
                },
                {
                    "name": "description",
                    "dataType": ["text"],
                    "description": "Beschreibung der Dienstleistung",
                },
                {
                    "name": "office",
                    "dataType": ["string"],
                    "description": "Zuständiges Amt",
                },
                {
                    "name": "link",
                    "dataType": ["string"],
                    "description": "Link zur Dienstleistung",
                },
                {
                    "name": "is_paid",
                    "dataType": ["boolean"],
                    "description": "Gibt an, ob die Dienstleistung kostenpflichtig ist",
                },
                {
                    "name": "is_online",
                    "dataType": ["boolean"],
                    "description": "Gibt an, ob die Dienstleistung online verfügbar ist",
                },
            ])
            
        # Spezifische Properties für Ortsrecht
        elif data_type == "local_law":
            properties.extend([
                {
                    "name": "title",
                    "dataType": ["string"],
                    "description": "Titel des Ortsrechts",
                },
                {
                    "name": "description",
                    "dataType": ["text"],
                    "description": "Beschreibung des Ortsrechts",
                },
                {
                    "name": "text",
                    "dataType": ["text"],
                    "description": "Text des Ortsrechts",
                },
                {
                    "name": "link",
                    "dataType": ["string"],
                    "description": "Link zum Ortsrecht",
                },
            ])
            
        # Spezifische Properties für Kindergärten
        elif data_type == "kindergarten":
            properties.extend([
                {
                    "name": "name",
                    "dataType": ["string"],
                    "description": "Name des Kindergartens",
                },
                {
                    "name": "address",
                    "dataType": ["string"],
                    "description": "Adresse des Kindergartens",
                },
                {
                    "name": "opening_hours",
                    "dataType": ["string"],
                    "description": "Öffnungszeiten des Kindergartens",
                },
                {
                    "name": "phone",
                    "dataType": ["string"],
                    "description": "Telefonnummer des Kindergartens",
                },
                {
                    "name": "email",
                    "dataType": ["string"],
                    "description": "E-Mail-Adresse des Kindergartens",
                },
                {
                    "name": "website",
                    "dataType": ["string"],
                    "description": "Website des Kindergartens",
                },
            ])
            
        # Spezifische Properties für Webseiten
        elif data_type == "webpage":
            properties.extend([
                {
                    "name": "title",
                    "dataType": ["string"],
                    "description": "Titel der Webseite",
                },
                {
                    "name": "url",
                    "dataType": ["string"],
                    "description": "URL der Webseite",
                },
                {
                    "name": "content",
                    "dataType": ["text"],
                    "description": "Inhalt der Webseite",
                },
            ])
            
        # Spezifische Properties für Entsorgung
        elif data_type == "waste_management":
            properties.extend([
                {
                    "name": "name",
                    "dataType": ["string"],
                    "description": "Name der Entsorgungsmöglichkeit",
                },
                {
                    "name": "description",
                    "dataType": ["text"],
                    "description": "Beschreibung der Entsorgungsmöglichkeit",
                },
            ])
                
        return properties

# Singleton-Instanz für direkten Zugriff
structured_data_service = StructuredDataService(weaviate_service) 