"""
Hauptmodul für den Weaviate-Service, das alle Komponenten zusammenführt.
"""

import logging
import json
from typing import Dict, Any, Optional, List, Tuple
import asyncio
import weaviate
from ...core.config import settings
from ...db.models import Tenant
from .search_manager import SearchManager
from .schema_manager import SchemaManager
from .client import get_client
from .document_manager import DocumentManager
from .health_manager import HealthManager
from app.models.weaviate_status import WeaviateStatus

class WeaviateService:
    """
    Hauptservice für die Interaktion mit Weaviate
    
    Dieser Service bündelt die Funktionalitäten der verschiedenen Manager-Klassen
    für Schema, Dokumente, Suche und Gesundheitsüberwachung.
    """
    
    def __init__(self):
        """Initialisiert den WeaviateService und erstellt das Standard-Schema."""
        self.initialize_schema()
        
    def initialize_schema(self):
        """Erstellt das Standard-Schema, falls es nicht existiert."""
        return SchemaManager.create_standard_schema()
    
    def create_tenant_schema(self, tenant_id: str) -> bool:
        """Erstellt ein Schema für einen Tenant."""
        return SchemaManager.create_tenant_schema(tenant_id)
    
    def delete_tenant_schema(self, tenant_id: str) -> bool:
        """Löscht das Schema für einen Tenant."""
        return SchemaManager.delete_tenant_schema(tenant_id)
    
    def tenant_class_exists(self, tenant_id: str) -> bool:
        """Überprüft, ob eine Klasse für den Tenant existiert."""
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        return SchemaManager.class_exists(class_name)
    
    def add_document(
        self,
        tenant_id: str,
        title: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        document_id: Optional[str] = None,
        source: Optional[str] = None
    ) -> Optional[str]:
        """Fügt ein Dokument zu einem Tenant hinzu."""
        return DocumentManager.add_document(
            tenant_id=tenant_id,
            title=title,
            content=content,
            metadata=metadata,
            document_id=document_id,
            source=source
        )
    
    def get_documents(self, tenant_id: str, document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Holt Dokumente für einen Tenant."""
        return DocumentManager.get_documents(tenant_id, document_id)
    
    def delete_document(self, tenant_id: str, document_id: str) -> bool:
        """Löscht ein Dokument eines Tenants."""
        return DocumentManager.delete_document(tenant_id, document_id)
    
    def get_document_status(self, tenant_id: str, document_id: str) -> Dict[str, Any]:
        """Prüft den Status eines Dokuments."""
        return DocumentManager.get_document_status(tenant_id, document_id)
    
    def update_document(self, tenant_id: str, document_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        """Aktualisiert ein Dokument."""
        return DocumentManager.update_document(tenant_id, document_id, properties)
    
    def search(self, tenant_id: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Führt eine Suche für einen Tenant durch."""
        return SearchManager.search(tenant_id, query, limit)
    
    def validate_tenant_class(self, tenant_id: str) -> bool:
        """Validiert die Klasse eines Tenants."""
        return HealthManager.validate_tenant_class(tenant_id)
    
    def validate_all_tenant_classes(self) -> Tuple[int, int]:
        """Validiert alle Tenant-Klassen."""
        return HealthManager.validate_all_tenant_classes()
    
    def reindex_document(self, tenant_id: str, document_id: str, document_data: Dict[str, Any]) -> bool:
        """Indiziert ein Dokument neu."""
        return HealthManager.reindex_document(tenant_id, document_id, document_data)
    
    def reindex_all_documents(self, tenant_id: str, documents: List[Dict[str, Any]]) -> int:
        """Indiziert alle Dokumente eines Tenants neu."""
        return HealthManager.reindex_all_documents(tenant_id, documents)
        
    def get_weaviate_status(self) -> Dict[str, Any]:
        """Prüft den Status der Weaviate-Verbindung"""
        client = get_client()
        status = {"connected": False}
        
        try:
            meta = client.get_meta()
            status["connected"] = True
            status["version"] = meta.get("version", "unbekannt")
            status["modules"] = meta.get("modules", [])
            
            # Prüfe den Cluster-Status
            try:
                nodes = client.cluster.get_nodes_status()
                status["cluster"] = {
                    "nodes": len(nodes),
                    "healthy": all(node.get("status", "") == "HEALTHY" for node in nodes)
                }
            except Exception as cluster_error:
                status["cluster_error"] = str(cluster_error)
                
            return status
            
        except Exception as e:
            status["error"] = str(e)
            return status

# Singleton-Instanz des Services
weaviate_service = WeaviateService() 