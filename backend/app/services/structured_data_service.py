"""
Service zur Verwaltung strukturierter Daten aus verschiedenen Quellen.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional, List, Union
import weaviate
import weaviate.classes as wvc
from datetime import datetime
from .xml_parser_service import BrandenburgXMLParser
from .weaviate.client import weaviate_client
from .weaviate.schema_manager import SchemaManager

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StructuredDataService:
    """
    Service zur Verwaltung strukturierter Daten für verschiedene Tenants.
    Unterstützt das Importieren, Speichern und Abrufen strukturierter Daten aus verschiedenen Quellen.
    """
    
    # Weaviate-Klassenpräfix für strukturierte Daten
    STRUCTURED_CLASS_PREFIX = "StructuredData"
    
    # Unterstützte Datentypen
    SUPPORTED_TYPES = ["school", "office", "event"]
    
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
                wvc.config.Property(name="name", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="type", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="schoolId", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="address", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="management", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactPhone", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactEmail", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactWebsite", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="allDayCare", data_type=wvc.config.DataType.BOOLEAN),
                wvc.config.Property(name="additionalInfo", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="description", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="link", data_type=wvc.config.DataType.TEXT),
                # Suchfeld für alle Inhalte
                wvc.config.Property(name="fullTextSearch", data_type=wvc.config.DataType.TEXT)
            ]
        elif data_type == "office":
            properties = [
                wvc.config.Property(name="name", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="department", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="address", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="openingHours", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactPhone", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactEmail", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactWebsite", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="services", data_type=wvc.config.DataType.TEXT_ARRAY),
                wvc.config.Property(name="description", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="content", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="link", data_type=wvc.config.DataType.TEXT),
                # Suchfeld für alle Inhalte
                wvc.config.Property(name="fullTextSearch", data_type=wvc.config.DataType.TEXT)
            ]
        elif data_type == "event":
            properties = [
                wvc.config.Property(name="title", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="date", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="time", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="location", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="description", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="content", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="organizer", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactPhone", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactEmail", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactWebsite", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="link", data_type=wvc.config.DataType.TEXT),
                # Suchfeld für alle Inhalte
                wvc.config.Property(name="fullTextSearch", data_type=wvc.config.DataType.TEXT)
            ]
        
        try:
            # Schema erstellen
            weaviate_client.collections.create(
                name=class_name,
                description=f"Strukturierte {data_type.capitalize()}-Daten für Tenant {tenant_id}",
                vectorizer_config=wvc.config.Configure.Vectorizer.text2vec_transformers(
                    vectorize_collection_name=False
                ),
                properties=properties
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
            # Daten speichern
            collection = weaviate_client.collections.get(class_name)
            collection.data.insert(
                uuid=data_id,
                properties=flattened_data
            )
            logger.info(f"{data_type.capitalize()}-Daten mit ID {data_id} zu Tenant {tenant_id} hinzugefügt")
            return data_id
        except Exception as e:
            logger.error(f"Fehler beim Speichern von {data_type}-Daten: {e}")
            return None
    
    @staticmethod
    def import_brandenburg_data(xml_file_path: str, tenant_id: str) -> Dict[str, int]:
        """
        Importiert Brandenburg-Daten aus einer XML-Datei und speichert sie in Weaviate.
        
        Args:
            xml_file_path: Pfad zur XML-Datei
            tenant_id: ID des Tenants
            
        Returns:
            Dict mit Anzahl der importierten Elemente pro Typ
        """
        parser = BrandenburgXMLParser(xml_file_path)
        
        if not parser.parse_file():
            logger.error(f"Konnte XML-Datei nicht parsen: {xml_file_path}")
            return {"schools": 0, "offices": 0, "events": 0}
        
        result = {"schools": 0, "offices": 0, "events": 0}
        
        # Schulen importieren
        schools = parser.extract_schools()
        for school in schools:
            if StructuredDataService.store_structured_data(tenant_id, "school", school["data"]):
                result["schools"] += 1
        
        # Ämter importieren
        offices = parser.extract_offices()
        for office in offices:
            if StructuredDataService.store_structured_data(tenant_id, "office", office["data"]):
                result["offices"] += 1
        
        # Veranstaltungen importieren
        events = parser.extract_events()
        for event in events:
            if StructuredDataService.store_structured_data(tenant_id, "event", event["data"]):
                result["events"] += 1
        
        logger.info(f"Import für Tenant {tenant_id} abgeschlossen: {result}")
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
            return {"schools": 0, "offices": 0, "events": 0}
        
        result = {"schools": 0, "offices": 0, "events": 0}
        
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
            # Suche durchführen
            collection = weaviate_client.collections.get(class_name)
            results = collection.query.hybrid(
                query=query,
                limit=limit,
                alpha=0.5  # Balance zwischen Vektor- und Keyword-Suche
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
    
    # Weitere Methoden zur Verwaltung strukturierter Daten...


# Singleton-Instanz für direkten Zugriff
structured_data_service = StructuredDataService() 