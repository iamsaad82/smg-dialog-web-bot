"""
Schema-Manager-Modul für die Verwaltung von Weaviate-Schemas und Klassen.
"""

import logging
import uuid
from typing import Dict, Any, Optional, List, Tuple
import weaviate
from weaviate.collections.classes.config import DataType, Property, VectorizerConfig
from .client import get_client

class SchemaManager:
    """Manager für die Verwaltung von Weaviate-Schemas und Klassen."""
    
    def __init__(self, client: weaviate.Client):
        self.client = client
        self.logger = logging.getLogger(__name__)

    @staticmethod
    def get_tenant_class_name(tenant_id: str) -> str:
        """Generiert einen standardisierten Klassennamen für einen Tenant."""
        # Weaviate v4 erfordert gültige Klassennamen: nur Buchstaben
        # und Ziffern, beginnt mit einem Großbuchstaben
        # Wir ersetzen die UUIDs durch einen kürzeren, gültigen Namen
        
        # Entferne alle Bindestriche und verwende nur die ersten 8 Zeichen zur Identifikation
        tenant_short_id = tenant_id.replace('-', '')[:8]
        
        # Stelle sicher, dass der Name mit einem Großbuchstaben beginnt
        return f"Tenant{tenant_short_id.capitalize()}"
    
    @staticmethod
    def class_exists(class_name: str) -> bool:
        """Prüft, ob eine Klasse in Weaviate existiert."""
        if not get_client():
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
        
        try:
            # In v4 versuchen wir einfach, die Collection zu erhalten
            # Wenn sie nicht existiert, wird eine Exception geworfen
            try:
                get_client().collections.get(class_name)
                return True
            except Exception:
                return False
        except Exception as e:
            logging.error(f"Fehler beim Prüfen der Klasse '{class_name}': {e}")
            return False
    
    @staticmethod
    def create_standard_schema() -> bool:
        """
        Erstellt das Standardschema mit vorkonfigurierten Klassen.
        """
        try:
            # Erstelle die Standard-Schema-Konfiguration
            schema_created = SchemaManager._create_standard_schema_config()
            if schema_created:
                logging.info("Standard-Schema erfolgreich erstellt")
            return schema_created
        except Exception as e:
            logging.error(f"Fehler beim Erstellen des Standard-Schemas: {str(e)}")
            return False
    
    @staticmethod
    def _create_standard_schema_config() -> bool:
        """
        Erstellt die Standardkonfiguration für das Schema.
        """
        client = get_client()
        
        try:
            # Erstelle eine Standardklasse für FAQ-Daten
            # Diese Klasse kann für allgemeine Informationen verwendet werden
            faq_class_name = "FAQ"
            
            # Prüfe, ob die Klasse bereits existiert
            if SchemaManager.class_exists(faq_class_name):
                logging.info(f"Klasse {faq_class_name} existiert bereits")
                return True
            
            # Erstelle die Klasse mit dem Transformers-Modul
            faq_collection = client.collections.create(
                name=faq_class_name,
                vectorizer_config=VectorizerConfig(
                    vectorizer="text2vec-transformers",
                    model="text2vec-transformers",
                    vectorize_collection_name=False
                ),
                properties=[
                    Property(
                        name="title",
                        data_type=DataType.TEXT
                    ),
                    Property(
                        name="content",
                        data_type=DataType.TEXT
                    ),
                    Property(
                        name="category",
                        data_type=DataType.TEXT
                    ),
                    Property(
                        name="tags",
                        data_type=DataType.TEXT_ARRAY
                    )
                ]
            )
            
            logging.info(f"FAQ-Klasse {faq_class_name} erfolgreich erstellt")
            return True
            
        except Exception as e:
            logging.error(f"Fehler beim Erstellen der Standardklassen: {str(e)}")
            return False
    
    @staticmethod
    def create_tenant_schema(tenant_id: str) -> bool:
        """
        Erstellt das Schema für einen spezifischen Tenant.
        Ein Tenant hat seine eigene Klasse für Dokumente.
        """
        client = get_client()
        
        try:
            # Name der Klasse basierend auf der Tenant-ID
            class_name = f"Tenant{tenant_id}"
            
            # Prüfe, ob die Klasse bereits existiert
            if SchemaManager.class_exists(class_name):
                logging.info(f"Tenant-Klasse {class_name} existiert bereits")
                return True
            
            # Erstelle die Tenant-Klasse
            tenant_collection = client.collections.create(
                name=class_name,
                vectorizer_config=VectorizerConfig(
                    vectorizer="text2vec-transformers",
                    model="text2vec-transformers",
                    vectorize_collection_name=False
                ),
                properties=[
                    Property(
                        name="title",
                        data_type=DataType.TEXT
                    ),
                    Property(
                        name="content", 
                        data_type=DataType.TEXT
                    ),
                    Property(
                        name="document_id",
                        data_type=DataType.TEXT,
                        indexFilterable=True
                    ),
                    Property(
                        name="chunk_id",
                        data_type=DataType.TEXT,
                        indexFilterable=True
                    ),
                    Property(
                        name="metadata",
                        data_type=DataType.TEXT
                    ),
                    Property(
                        name="source",
                        data_type=DataType.TEXT
                    ),
                    Property(
                        name="status",
                        data_type=DataType.TEXT,
                        indexFilterable=True
                    )
                ]
            )
            
            logging.info(f"Tenant-Klasse {class_name} erfolgreich erstellt")
            return True
            
        except Exception as e:
            logging.error(f"Fehler beim Erstellen des Tenant-Schemas {tenant_id}: {str(e)}")
            return False
    
    @staticmethod
    def delete_tenant_schema(tenant_id: str) -> bool:
        """Löscht das Schema (Klasse) eines Tenants."""
        if not get_client():
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        # Prüfen, ob Klasse existiert
        if not SchemaManager.class_exists(class_name):
            return True  # Klasse existiert nicht, also nichts zu löschen
        
        try:
            # Klasse löschen
            get_client().collections.delete(class_name)
            logging.info(f"Schema für Tenant {tenant_id} gelöscht")
            return True
        except Exception as e:
            logging.error(f"Fehler beim Löschen des Tenant-Schemas: {e}")
            return False 