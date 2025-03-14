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
                wvc.config.Property(name="organizer", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactPhone", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactEmail", data_type=wvc.config.DataType.TEXT),
                wvc.config.Property(name="contactWebsite", data_type=wvc.config.DataType.TEXT),
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
                nested = StructuredDataService.flatten_data(value, f"{key}_")
                result.update(nested)
            else:
                # Schlüssel mit Präfix verwenden
                new_key = f"{prefix}{key}"
                result[new_key] = value
        
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
            logger.warning(f"Klasse {class_name} existiert nicht")
            return []
        
        try:
            # Suche durchführen
            collection = weaviate_client.collections.get(class_name)
            
            # Hybrid-Suche für bessere Ergebnisse
            response = collection.query.hybrid(
                query=query,
                limit=limit,
                alpha=0.75  # Gewichtung zwischen Vektor- und Keyword-Suche
            )
            
            # Ergebnisse in strukturierte Daten umwandeln
            results = []
            for obj in response.objects:
                # UUID als ID verwenden
                item_id = str(obj.uuid)
                
                # Eigenschaften in ursprüngliche Struktur zurückwandeln
                item_props = {}
                contact_props = {}
                details_props = {}
                
                for key, value in obj.properties.items():
                    if key.startswith("contact_"):
                        contact_props[key.replace("contact_", "")] = value
                    elif key.startswith("details_"):
                        details_props[key.replace("details_", "")] = value
                    elif key != "fullTextSearch":  # Suchfeld ignorieren
                        item_props[key] = value
                
                # Strukturierte Daten zusammensetzen
                structured_item = {
                    "id": item_id,
                    **item_props
                }
                
                if contact_props:
                    structured_item["contact"] = contact_props
                
                if details_props:
                    structured_item["details"] = details_props
                
                # Ergebnis zur Liste hinzufügen
                results.append({
                    "type": data_type,
                    "data": structured_item
                })
            
            return results
        except Exception as e:
            logger.error(f"Fehler bei der Suche nach {data_type}-Daten: {e}")
            return []


# Singleton-Instanz für direkten Zugriff
structured_data_service = StructuredDataService() 