"""
Schema-Manager-Modul für die Verwaltung von Weaviate-Schemas und Klassen.
"""

import logging
from typing import Dict, Any, Optional, List
import weaviate
# weaviate.classes existiert in Weaviate v4 nicht mehr in dieser Form
# import weaviate.classes as wvc
from .client import weaviate_client
from ...utils.uuid_helper import to_str  # Importiere die UUID-Hilfsfunktion

class SchemaManager:
    """Manager für die Verwaltung von Weaviate-Schemas und Klassen."""
    
    @staticmethod
    def get_tenant_class_name(tenant_id) -> str:
        """Erzeugt einen eindeutigen Klassennamen für jeden Tenant."""
        # Konvertiere tenant_id zu String mit der Hilfsfunktion
        tenant_str = to_str(tenant_id)
        return f"Tenant{tenant_str.replace('-', '')}"
    
    @staticmethod
    def class_exists(class_name: str) -> bool:
        """Prüft, ob eine Klasse in Weaviate existiert."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        try:
            # In v4 wird die Klasse als "Collection" bezeichnet
            return weaviate_client.collections.exists(class_name)
        except Exception as e:
            logging.error(f"Fehler beim Prüfen der Klasse {class_name}: {e}")
            return False
    
    @staticmethod
    def create_standard_schema() -> bool:
        """Initialisiert ein Standard-Schema, um Weaviate zu aktivieren."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        schema_class_name = "StandbyClass"
        
        # Prüfen, ob Klasse bereits existiert
        if SchemaManager.class_exists(schema_class_name):
            return True
        
        try:
            # Standard-Schema erstellen mit Weaviate v4 API
            weaviate_client.collections.create(
                name=schema_class_name,
                description="Standard-Klasse für Weaviate-Initialisierung",
                vectorizer_config={"vectorizer": "text2vec-transformers"},
                properties=[
                    {
                        "name": "text",
                        "data_type": ["text"],
                        "description": "Ein Textfeld"
                    }
                ]
            )
            
            logging.info(f"Standard-Schema '{schema_class_name}' erstellt")
            return True
        except Exception as e:
            logging.error(f"Fehler beim Erstellen des Standard-Schemas: {e}")
            return False
    
    @staticmethod
    def create_tenant_schema(tenant_id: str) -> bool:
        """Erstellt ein Schema (Klasse) für einen neuen Tenant."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        # Prüfen, ob Klasse bereits existiert
        if SchemaManager.class_exists(class_name):
            return True
        
        try:
            # Schema mit Text- und Metadatenfeldern erstellen mit Weaviate v4 API
            weaviate_client.collections.create(
                name=class_name,
                description=f"Wissensbasis für Tenant {tenant_id}",
                vectorizer_config={"vectorizer": "text2vec-transformers"},
                properties=[
                    {
                        "name": "title",
                        "data_type": ["text"],
                        "description": "Der Titel des Dokuments"
                    },
                    {
                        "name": "content",
                        "data_type": ["text"],
                        "description": "Der Inhalt des Dokuments"
                    },
                    {
                        "name": "metadata",
                        "data_type": ["text"],
                        "description": "Zusätzliche Metadaten zum Dokument"
                    },
                    {
                        "name": "source",
                        "data_type": ["text"],
                        "description": "Die Quelle des Dokuments"
                    }
                ]
            )
            
            logging.info(f"Schema für Tenant {tenant_id} erstellt")
            return True
        except Exception as e:
            logging.error(f"Fehler beim Erstellen des Tenant-Schemas: {e}")
            return False
    
    @staticmethod
    def delete_tenant_schema(tenant_id: str) -> bool:
        """Löscht das Schema (Klasse) eines Tenants."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        try:
            # Prüfen, ob Klasse existiert
            if not SchemaManager.class_exists(class_name):
                logging.warning(f"Klasse {class_name} existiert nicht")
                return True
                
            # Klasse löschen
            weaviate_client.collections.delete(class_name)
            logging.info(f"Klasse {class_name} erfolgreich gelöscht")
            return True
        except Exception as e:
            logging.error(f"Fehler beim Löschen der Klasse {class_name}: {e}")
            return False 