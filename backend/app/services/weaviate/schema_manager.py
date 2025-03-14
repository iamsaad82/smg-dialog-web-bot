"""
Schema-Manager-Modul für die Verwaltung von Weaviate-Schemas und Klassen.
"""

import logging
from typing import Dict, Any, Optional, List
import weaviate
import weaviate.classes as wvc
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
            # Standard-Schema erstellen
            weaviate_client.collections.create(
                name=schema_class_name,
                description="Standard-Klasse für Weaviate-Initialisierung",
                vectorizer_config=wvc.config.Configure.Vectorizer.text2vec_transformers(),
                properties=[
                    wvc.config.Property(
                        name="text",
                        data_type=wvc.config.DataType.TEXT,
                        description="Ein Textfeld"
                    )
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
            # Schema mit Text- und Metadatenfeldern erstellen
            weaviate_client.collections.create(
                name=class_name,
                description=f"Wissensbasis für Tenant {tenant_id}",
                vectorizer_config=wvc.config.Configure.Vectorizer.text2vec_transformers(
                    vectorize_collection_name=False
                ),
                properties=[
                    wvc.config.Property(
                        name="title",
                        data_type=wvc.config.DataType.TEXT,
                        description="Der Titel des Dokuments"
                    ),
                    wvc.config.Property(
                        name="content",
                        data_type=wvc.config.DataType.TEXT,
                        description="Der Inhalt des Dokuments"
                    ),
                    wvc.config.Property(
                        name="metadata",
                        data_type=wvc.config.DataType.TEXT,
                        description="Zusätzliche Metadaten zum Dokument"
                    ),
                    wvc.config.Property(
                        name="source",
                        data_type=wvc.config.DataType.TEXT,
                        description="Die Quelle des Dokuments"
                    )
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