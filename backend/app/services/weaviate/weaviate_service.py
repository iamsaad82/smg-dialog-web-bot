"""
Hauptmodul für den Weaviate-Service, das alle Komponenten zusammenführt.
"""

import logging
import json
from typing import Dict, Any, Optional, List, Tuple
import asyncio
import weaviate
from weaviate.util import generate_uuid5
from ...core.config import settings
from ...db.models import Tenant
from .search_manager import SearchManager
from .schema_manager import SchemaManager
from .client import weaviate_client, connect_to_local
from .document_manager import DocumentManager
from .health_manager import HealthManager
from app.models.weaviate_status import WeaviateStatus

class WeaviateService:
    """
    Hauptklasse für die Interaktion mit Weaviate.
    Diese Klasse dient als Fassade für alle Weaviate-bezogenen Operationen.
    """
    
    def __init__(self):
        """Initialisiert den Weaviate-Service und stellt die Verbindung her."""
        self.client = connect_to_local()
        self.initialize_schema()
    
    def initialize_schema(self) -> bool:
        """Initialisiert das Standard-Schema in Weaviate."""
        return SchemaManager.create_standard_schema()
    
    def create_tenant_schema(self, tenant_id: str) -> bool:
        """Erstellt ein Schema für einen neuen Tenant."""
        return SchemaManager.create_tenant_schema(tenant_id)
    
    def delete_tenant_schema(self, tenant_id: str) -> bool:
        """Löscht das Schema für einen Tenant."""
        return SchemaManager.delete_tenant_schema(tenant_id)
    
    def tenant_class_exists(self, tenant_id: str) -> bool:
        """Überprüft, ob eine Klasse für den Tenant existiert."""
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        return SchemaManager.class_exists(class_name)
    
    async def validate_tenant_class(self, tenant_id: str) -> bool:
        """
        Überprüft, ob eine Tenant-Klasse existiert und valide ist.
        Bei Problemen wird versucht, die Klasse neu zu erstellen.
        """
        return await HealthManager.validate_tenant_class(tenant_id)
    
    async def validate_all_tenant_classes(self) -> Tuple[int, int]:
        """
        Überprüft alle bestehenden Tenant-Klassen auf Validität.
        Gibt die Anzahl der geprüften und reparierten Klassen zurück.
        """
        return await HealthManager.validate_all_tenant_classes()
    
    def add_document(self, tenant_id: str, title: str, content: str, 
                    metadata: Optional[Dict[str, Any]] = None, 
                    source: Optional[str] = None) -> Optional[str]:
        """
        Fügt ein Dokument zur Wissensbasis eines Tenants hinzu.
        Gibt die ID des erstellten Dokuments zurück oder None bei Fehler.
        """
        return DocumentManager.add_document(tenant_id, title, content, metadata, source)
    
    def get_documents(self, tenant_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Ruft alle Dokumente für einen Tenant ab.
        Gibt eine Liste von Dokumenten zurück.
        """
        return DocumentManager.get_documents(tenant_id, limit, offset)
    
    def delete_document(self, tenant_id: str, doc_id: str) -> bool:
        """
        Löscht ein Dokument aus der Wissensbasis eines Tenants.
        Gibt True zurück, wenn das Löschen erfolgreich war.
        """
        return DocumentManager.delete_document(tenant_id, doc_id)
    
    def get_document_status(self, tenant_id: str, doc_id: str) -> WeaviateStatus:
        """
        Überprüft den Status eines Dokuments in Weaviate.
        Gibt ein WeaviateStatus-Objekt zurück.
        """
        return DocumentManager.get_document_status(tenant_id, doc_id)
    
    def update_document(self, tenant_id: str, doc_id: str, 
                       title: Optional[str] = None, 
                       content: Optional[str] = None,
                       metadata: Optional[Dict[str, Any]] = None, 
                       source: Optional[str] = None) -> bool:
        """
        Aktualisiert ein bestehendes Dokument.
        Gibt True zurück, wenn das Update erfolgreich war.
        """
        return DocumentManager.update_document(tenant_id, doc_id, title, content, metadata, source)
    
    def search(self, tenant_id: str, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Führt eine semantische Suche in der Wissensbasis eines Tenants durch.
        Die Suche verwendet automatisch die beste verfügbare Suchmethode.
        Gibt eine Liste von Dokumenten zurück, sortiert nach Relevanz.
        """
        return SearchManager.search(tenant_id, query, limit)
    
    async def reindex_document(self, document: Any) -> bool:
        """
        Indiziert ein Dokument in Weaviate neu.
        Gibt True zurück, wenn die Neu-Indizierung erfolgreich war.
        """
        return await HealthManager.reindex_document(document)
    
    async def reindex_all_documents(self, tenant_id: str, documents: List[Any]) -> Tuple[int, int]:
        """
        Indiziert alle Dokumente eines Tenants neu.
        Gibt die Anzahl der Dokumente und die Anzahl der erfolgreich indizierten Dokumente zurück.
        """
        return await HealthManager.reindex_all_documents(tenant_id, documents)
    
    def count_documents(self, tenant_id: str) -> int:
        """
        Zählt die Anzahl der Dokumente für einen Tenant.
        Gibt die Anzahl der Dokumente zurück.
        """
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return 0
            
        try:
            class_name = SchemaManager.get_tenant_class_name(tenant_id)
            
            # Prüfen, ob die Klasse existiert
            if not SchemaManager.class_exists(class_name):
                logging.warning(f"Klasse {class_name} existiert nicht")
                return 0
                
            # Anzahl der Dokumente abrufen
            collection = weaviate_client.collections.get(class_name)
            count = collection.aggregate.over_all().total_count
            
            return count
            
        except Exception as e:
            logging.error(f"Fehler beim Zählen der Dokumente für Tenant {tenant_id}: {e}")
            return 0

# Singleton-Instanz des Weaviate-Service
weaviate_service = WeaviateService() 