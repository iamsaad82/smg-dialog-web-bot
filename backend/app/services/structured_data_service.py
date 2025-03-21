"""
Service zur Verwaltung strukturierter Daten aus verschiedenen Quellen.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional, List, Union
import weaviate
from datetime import datetime
from weaviate.util import generate_uuid5
from .xml_parser_service import XMLParserBase
from .weaviate.client import get_client
from .weaviate.schema_manager import SchemaManager
from .weaviate import WeaviateService, weaviate_service
from .xml_parser_factory import XMLParserFactory
import os
import tempfile
from pathlib import Path
import time

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
        """Erstellt ein Schema (Klasse) für einen strukturierten Datentyp und Tenant."""
        client = get_client()
        if not client:
            logger.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = StructuredDataService.get_class_name(tenant_id, data_type)
        
        # Prüfen, ob Klasse bereits existiert
        if SchemaManager.class_exists(class_name):
            return True
        
        from weaviate.collections.classes.config import Property, DataType, VectorizerConfig

        try:
            # Eigenschaften für den Datentyp definieren
            properties = []
            
            if data_type == "school":
                properties = [
                    Property(name="name", data_type=DataType.TEXT),
                    Property(name="type", data_type=DataType.TEXT),
                    Property(name="schoolId", data_type=DataType.TEXT),
                    Property(name="street", data_type=DataType.TEXT),
                    Property(name="city", data_type=DataType.TEXT),
                    Property(name="zip", data_type=DataType.TEXT),
                    Property(name="phone", data_type=DataType.TEXT),
                    Property(name="email", data_type=DataType.TEXT),
                    Property(name="website", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            elif data_type == "office":
                properties = [
                    Property(name="name", data_type=DataType.TEXT),
                    Property(name="type", data_type=DataType.TEXT),
                    Property(name="officeId", data_type=DataType.TEXT),
                    Property(name="street", data_type=DataType.TEXT),
                    Property(name="city", data_type=DataType.TEXT),
                    Property(name="zip", data_type=DataType.TEXT),
                    Property(name="phone", data_type=DataType.TEXT),
                    Property(name="email", data_type=DataType.TEXT),
                    Property(name="website", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="openingHours", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            elif data_type == "event":
                properties = [
                    Property(name="title", data_type=DataType.TEXT),
                    Property(name="date", data_type=DataType.TEXT),
                    Property(name="time", data_type=DataType.TEXT),
                    Property(name="location", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="organizer", data_type=DataType.TEXT),
                    Property(name="eventId", data_type=DataType.TEXT),
                    Property(name="category", data_type=DataType.TEXT),
                    Property(name="link", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            elif data_type == "service":
                properties = [
                    Property(name="title", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="requirements", data_type=DataType.TEXT),
                    Property(name="costs", data_type=DataType.TEXT),
                    Property(name="processTime", data_type=DataType.TEXT),
                    Property(name="serviceId", data_type=DataType.TEXT),
                    Property(name="officeId", data_type=DataType.TEXT),
                    Property(name="formUrl", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            elif data_type == "local_law":
                properties = [
                    Property(name="title", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="content", data_type=DataType.TEXT),
                    Property(name="lawId", data_type=DataType.TEXT),
                    Property(name="category", data_type=DataType.TEXT),
                    Property(name="validFrom", data_type=DataType.TEXT),
                    Property(name="validUntil", data_type=DataType.TEXT),
                    Property(name="link", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            elif data_type == "kindergarten":
                properties = [
                    Property(name="name", data_type=DataType.TEXT),
                    Property(name="type", data_type=DataType.TEXT),
                    Property(name="kitaId", data_type=DataType.TEXT),
                    Property(name="street", data_type=DataType.TEXT),
                    Property(name="city", data_type=DataType.TEXT),
                    Property(name="zip", data_type=DataType.TEXT),
                    Property(name="phone", data_type=DataType.TEXT),
                    Property(name="email", data_type=DataType.TEXT),
                    Property(name="website", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="openingHours", data_type=DataType.TEXT),
                    Property(name="ageGroups", data_type=DataType.TEXT),
                    Property(name="pedagogicalConcept", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            elif data_type == "webpage":
                properties = [
                    Property(name="title", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="content", data_type=DataType.TEXT),
                    Property(name="url", data_type=DataType.TEXT),
                    Property(name="lastUpdated", data_type=DataType.TEXT),
                    Property(name="category", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            elif data_type == "waste_management":
                properties = [
                    Property(name="title", data_type=DataType.TEXT),
                    Property(name="description", data_type=DataType.TEXT),
                    Property(name="content", data_type=DataType.TEXT),
                    Property(name="date", data_type=DataType.TEXT),
                    Property(name="wasteType", data_type=DataType.TEXT),
                    Property(name="link", data_type=DataType.TEXT),
                    Property(name="fullTextSearch", data_type=DataType.TEXT)
                ]
            else:
                logger.error(f"Unbekannter Datentyp: {data_type}")
                return False

            # Schemaklasse erstellen mit korrektem Format für Weaviate v4
            logger.info(f"Erstelle Schema für {data_type} - Tenant {tenant_id}")
            
            # Vektorkonfiguration für Weaviate v4 korrekt einrichten
            vectorizer_config = VectorizerConfig(
                vectorizer="text2vec-transformers",
                model="text2vec-transformers",
                vectorize_collection_name=False
            )
            
            client.collections.create(
                name=class_name,
                description=f"Strukturierte Daten vom Typ {data_type} für Tenant {tenant_id}",
                properties=properties,
                vectorizer_config=vectorizer_config
            )

            logger.info(f"Schema für {data_type} erfolgreich erstellt")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Erstellen des Schemas für {data_type}: {str(e)}")
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
    
    def store_structured_data(self, tenant_id: str, data_type: str, data: Dict[str, Any]) -> bool:
        """Speichert strukturierte Daten in Weaviate."""
        client = get_client()
        if not client:
            logger.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = self.get_class_name(tenant_id, data_type)
        
        # Sicherstellen, dass das Schema existiert
        if not self.create_schema_for_type(tenant_id, data_type):
            logger.error(f"Konnte Schema für {data_type} nicht erstellen")
            return False
        
        try:
            # Daten flachen und in Weaviate speichern
            flattened_data = self.flatten_data(data)
            
            # "Volltextsuche" Feld für bessere Suchergebnisse
            full_text = " ".join(str(value) for value in flattened_data.values() if value)
            flattened_data["fullTextSearch"] = full_text
            
            # Weaviate-Dokument erstellen
            collection = client.collections.get(class_name)
            doc_id = str(uuid.uuid4())
            collection.data.insert(
                uuid=doc_id,
                properties=flattened_data
            )
            
            # Daten auch als durchsuchbares Dokument in Tenant-Klasse speichern
            tenant_class = SchemaManager.get_tenant_class_name(tenant_id)
            if not SchemaManager.class_exists(tenant_class):
                SchemaManager.create_tenant_schema(tenant_id)
            
            # Dokument für die Tenant-Klasse vorbereiten
            doc_title = data.get("name", "") or data.get("title", "")
            doc_content = []
            
            # Alle relevanten Felder zum Content hinzufügen
            for key, value in flattened_data.items():
                if isinstance(value, str) and value:
                    if key in ["name", "title"]:
                        continue  # Diese werden schon im Titel verwendet
                    doc_content.append(f"{key}: {value}")
                elif isinstance(value, dict):
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, str) and sub_value:
                            doc_content.append(f"{sub_key}: {sub_value}")
            
            # Dokument in Tenant-Klasse speichern
            tenant_collection = client.collections.get(tenant_class)
            tenant_collection.data.insert(
                uuid=str(uuid.uuid4()),
                properties={
                    "title": doc_title,
                    "content": "\n".join(doc_content),
                    "metadata": json.dumps({
                        "type": data_type,
                        "original_id": doc_id
                    }),
                    "source": f"Structured Data ({data_type})"
                }
            )
            
            logger.info(f"Strukturierte Daten erfolgreich gespeichert: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Fehler beim Speichern der strukturierten Daten: {e}")
            return False
    
    def import_xml_data(self, xml_file_path: str, tenant_id: str, xml_type: str = "generic") -> Dict[str, int]:
        """
        Importiert XML-Daten aus einer Datei.
        
        Args:
            xml_file_path: Pfad zur XML-Datei
            tenant_id: ID des Tenants
            xml_type: Typ der XML-Datei (generic, brandenburg, etc.)
            
        Returns:
            Dict[str, int]: Statistiken des Imports (Anzahl je Typ)
        """
        try:
            # Spezifischen XML-Parser basierend auf dem Typ erstellen
            xml_parser = XMLParserBase.get_parser_for_type(xml_type)
            
            # XML-Datei parsen
            print(f"Starte XML-Import für Tenant {tenant_id}, Typ: {xml_type}")
            parsed_data = xml_parser.parse_file(xml_file_path)
            
            if not parsed_data:
                print(f"Keine Daten in der XML-Datei gefunden")
                return {"total": 0}
            
            # Import-Ergebnisse speichern
            result_counts = {"total": 0}
            
            # Daten importieren
            for data_type, data_items in parsed_data.items():
                if not data_items:
                    continue
                
                # Datentyp zu Weaviate-Typ mappen
                weaviate_type = self.TYPE_MAPPING.get(data_type)
                if not weaviate_type:
                    print(f"Unbekannter Datentyp: {data_type}")
                    continue
                
                # Schema erstellen, falls nicht vorhanden
                self.create_schema_for_type(tenant_id, weaviate_type)
                
                # Daten speichern
                stored_count = 0
                for item in data_items:
                    if self.store_structured_data(tenant_id, weaviate_type, item):
                        stored_count += 1
                
                result_counts[data_type] = stored_count
                result_counts["total"] += stored_count
                
                print(f"Importiert: {stored_count} {data_type}")
            
            return result_counts
            
        except Exception as e:
            print(f"Fehler beim Importieren der XML-Daten: {str(e)}")
            import traceback
            traceback.print_exc()
            return {"error": str(e), "total": 0}
    
    @staticmethod
    def clear_existing_data(tenant_id: str) -> bool:
        """
        Löscht alle existierenden strukturierten Daten für einen Tenant.
        
        Args:
            tenant_id: ID des Tenants
            
        Returns:
            bool: True bei Erfolg, False bei Fehler
        """
        client = get_client()
        if not client:
            logger.error("Weaviate-Client ist nicht initialisiert")
            return False
        
        success = True
        
        # Für jeden unterstützten Datentyp das entsprechende Schema löschen und neu erstellen
        for data_type in StructuredDataService.SUPPORTED_TYPES:
            class_name = StructuredDataService.get_class_name(tenant_id, data_type)
            
            try:
                # Prüfen, ob die Klasse existiert
                if client.schema.exists_class(class_name):
                    # Klasse löschen
                    collection = client.collections.get(class_name)
                    collection.delete()
                    logger.info(f"Klasse {class_name} gelöscht")
                    
                    # Kurze Pause, um sicherzustellen, dass Weaviate die Änderung verarbeitet
                    time.sleep(0.5)
                    
                # Klasse neu erstellen
                client.collections.create(
                    name=class_name,
                    description=f"Strukturierte Daten vom Typ {data_type} für Tenant {tenant_id}",
                    vectorizer_config=VectorizerConfig(
                        "text2vec-transformers",
                        vectorize_collection_name=False
                    )
                )
                
                logger.info(f"Klasse {class_name} neu erstellt")
            except Exception as e:
                logger.error(f"Fehler beim Löschen/Neuerstellen von {class_name}: {str(e)}")
                success = False
        
        return success
    
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
        client = get_client()
        if not client:
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
            # Vectorsuche durchführen
            logger.info(f"Führe Suche in {class_name} mit Query '{query}' durch")
            
            collection = client.collections.get(class_name)
            
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