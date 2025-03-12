"""
Document-Manager-Modul für die Verwaltung von Dokumenten in Weaviate.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional, List
import weaviate
import weaviate.classes as wvc
from datetime import datetime
from ...schemas.document import Document, WeaviateStatus
from .client import weaviate_client
from .schema_manager import SchemaManager
from app.models.weaviate_status import WeaviateStatus, IndexStatus

class DocumentManager:
    """Manager für die Verwaltung von Dokumenten in Weaviate."""
    
    @staticmethod
    def add_document(
        tenant_id: str, 
        title: str, 
        content: str, 
        metadata: Optional[Dict[str, Any]] = None, 
        source: Optional[str] = None
    ) -> Optional[str]:
        """Fügt ein Dokument zur Wissensbasis eines Tenants hinzu."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return None
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        # Sicherstellen, dass das Schema für den Tenant existiert
        if not SchemaManager.class_exists(class_name):
            if not SchemaManager.create_tenant_schema(tenant_id):
                logging.error(f"Konnte Schema für Tenant {tenant_id} nicht erstellen")
                return None
        
        # UUID erstellen für das Dokument
        doc_id = str(uuid.uuid4())
        
        # Dokument-Objekt erstellen
        properties = {
            "title": title,
            "content": content,
            "metadata": json.dumps(metadata or {}),
            "source": source or "Manual Upload"
        }
        
        try:
            # Dokument hinzufügen
            collection = weaviate_client.collections.get(class_name)
            collection.data.insert(
                uuid=doc_id,
                properties=properties
            )
            logging.info(f"Dokument {doc_id} erfolgreich zu Tenant {tenant_id} hinzugefügt")
            return doc_id
        except Exception as e:
            logging.error(f"Fehler beim Hinzufügen des Dokuments: {e}")
            return None
    
    @staticmethod
    def get_documents(tenant_id: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Ruft alle Dokumente eines Tenants ab."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return []
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        # Prüfen, ob Klasse existiert
        if not SchemaManager.class_exists(class_name):
            logging.warning(f"Klasse {class_name} existiert nicht")
            return []
        
        try:
            # Dokumente abrufen
            collection = weaviate_client.collections.get(class_name)
            response = collection.query.fetch_objects(
                limit=limit,
                offset=offset,
                include_vector=False
            )
            
            # Ergebnisse formatieren
            documents = []
            for obj in response.objects:
                doc = {
                    "id": str(obj.uuid),
                    "title": obj.properties.get("title", ""),
                    "content": obj.properties.get("content", ""),
                    "source": obj.properties.get("source", ""),
                }
                
                # Metadaten aus JSON-String zurück in Objekt konvertieren
                metadata_str = obj.properties.get("metadata", "{}")
                try:
                    doc["metadata"] = json.loads(metadata_str)
                except:
                    doc["metadata"] = {}
                
                documents.append(doc)
            
            return documents
        except Exception as e:
            logging.error(f"Fehler beim Abrufen der Dokumente: {e}")
            return []
    
    @staticmethod
    def delete_document(tenant_id: str, doc_id: str) -> bool:
        """Löscht ein Dokument aus der Wissensbasis eines Tenants."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        try:
            # Prüfen, ob Klasse existiert
            if not SchemaManager.class_exists(class_name):
                logging.warning(f"Klasse {class_name} existiert nicht")
                return False
                
            # Dokument löschen
            collection = weaviate_client.collections.get(class_name)
            collection.data.delete_by_id(doc_id)
            logging.info(f"Dokument {doc_id} erfolgreich gelöscht")
            return True
        except Exception as e:
            logging.error(f"Fehler beim Löschen des Dokuments {doc_id}: {e}")
            return False
    
    @staticmethod
    async def get_document_status(tenant_id: str, doc_id: str) -> WeaviateStatus:
        """
        Überprüft den Status eines Dokuments in Weaviate.
        Gibt ein WeaviateStatus-Objekt zurück.
        """
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return WeaviateStatus(
                status=IndexStatus.FEHLER,
                error="Weaviate-Client ist nicht initialisiert"
            )
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        try:
            # Prüfen, ob die Klasse existiert
            if not SchemaManager.class_exists(class_name):
                logging.warning(f"Klasse {class_name} existiert nicht")
                return WeaviateStatus(
                    status=IndexStatus.NICHT_INDIZIERT,
                    error="Tenant-Klasse existiert nicht"
                )
                
            # Dokument abrufen und auf Vektor prüfen
            try:
                collection = weaviate_client.collections.get(class_name)
                obj = collection.query.fetch_object_by_id(
                    uuid=doc_id,
                    include_vector=True
                )
                
                if not obj:
                    # Dokument existiert nicht
                    return WeaviateStatus(
                        status=IndexStatus.NICHT_INDIZIERT,
                        error="Dokument nicht gefunden"
                    )
                
                # Prüfen, ob ein Vektor vorhanden ist
                if obj.vector:
                    # Dokument ist vollständig indiziert
                    return WeaviateStatus(
                        status=IndexStatus.INDIZIERT,
                        lastUpdated=obj.metadata.lastUpdateTimeUnix if hasattr(obj.metadata, "lastUpdateTimeUnix") else None
                    )
                else:
                    # Vektor fehlt noch (in Bearbeitung)
                    return WeaviateStatus(
                        status=IndexStatus.NICHT_INDIZIERT,
                        lastUpdated=obj.metadata.lastUpdateTimeUnix if hasattr(obj.metadata, "lastUpdateTimeUnix") else None
                    )
                
            except weaviate.exceptions.WeaviateQueryError as e:
                error_msg = str(e).lower()
                if "resolve node name" in error_msg or "status code: 500" in error_msg:
                    # Bekannter Fehler bei defekten Klassen
                    return WeaviateStatus(
                        status=IndexStatus.FEHLER,
                        error="Nodeauflösung fehlgeschlagen - Neuindizierung erforderlich"
                    )
                else:
                    # Andere Abfragefehler
                    return WeaviateStatus(
                        status=IndexStatus.FEHLER,
                        error=f"Query-Fehler: {str(e)}"
                    )
                
        except Exception as e:
            logging.error(f"Fehler beim Abrufen des Dokument-Status: {e}")
            return WeaviateStatus(
                status=IndexStatus.FEHLER,
                error=f"Fehler: {str(e)}"
            )
    
    @staticmethod
    async def update_document(
        tenant_id: str, 
        doc_id: str, 
        title: Optional[str] = None, 
        content: Optional[str] = None, 
        metadata: Optional[Dict[str, Any]] = None,
        source: Optional[str] = None
    ) -> bool:
        """Aktualisiert ein bestehendes Dokument in Weaviate."""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        try:
            # Prüfen, ob Klasse existiert
            if not SchemaManager.class_exists(class_name):
                logging.warning(f"Klasse {class_name} existiert nicht")
                return False
                
            # Aktuelles Objekt abrufen
            collection = weaviate_client.collections.get(class_name)
            
            try:
                obj = collection.query.fetch_object_by_id(doc_id)
                if not obj:
                    logging.warning(f"Dokument {doc_id} nicht gefunden")
                    return False
            except weaviate.exceptions.WeaviateQueryError as e:
                # Bei Node-Auflösungsfehler direkt aktualisieren
                if "resolve node name" in str(e).lower():
                    logging.warning(f"Nodename-Fehler beim Abrufen des Dokuments, versuche direktes Update")
                    obj = None
                else:
                    raise e
            
            # Update-Objekt mit nur den geänderten Eigenschaften erstellen
            properties = {}
            if title is not None:
                properties["title"] = title
            if content is not None:
                properties["content"] = content
            if metadata is not None:
                properties["metadata"] = json.dumps(metadata)
            if source is not None:
                properties["source"] = source
            
            if not properties:
                logging.info("Keine Änderungen angegeben")
                return True
            
            # Dokument aktualisieren
            collection.data.update(
                uuid=doc_id,
                properties=properties
            )
            
            logging.info(f"Dokument {doc_id} erfolgreich aktualisiert")
            return True
            
        except Exception as e:
            logging.error(f"Fehler beim Aktualisieren des Dokuments {doc_id}: {e}")
            return False 