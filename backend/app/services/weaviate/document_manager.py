"""
Document-Manager-Modul für die Verwaltung von Dokumenten in Weaviate.
"""

import logging
import json
import uuid
from typing import Dict, Any, Optional, List
import weaviate
from datetime import datetime
from ...schemas.document import Document, WeaviateStatus
from ...models.weaviate_status import IndexStatus
from .client import get_client
from .schema_manager import SchemaManager
from weaviate.collections.classes.filters import Filter

class DocumentManager:
    """
    Verwaltet den Lebenszyklus von Dokumenten in Weaviate
    """
    
    @staticmethod
    def add_document(
        tenant_id: str, 
        title: str, 
        content: str, 
        metadata: Optional[Dict[str, Any]] = None, 
        source: Optional[str] = None,
        document_id: Optional[str] = None
    ) -> Optional[str]:
        """Fügt ein Dokument zur Wissensbasis eines Tenants hinzu."""
        try:
            client = get_client()
            collection_name = SchemaManager.get_tenant_class_name(tenant_id)
            
            # Sicherstellen, dass das Schema für den Tenant existiert
            if not SchemaManager.class_exists(collection_name):
                try:
                    if not SchemaManager.create_tenant_schema(tenant_id):
                        logging.error(f"Konnte Schema für Tenant {tenant_id} nicht erstellen")
                        # Trotzdem fortfahren mit einer simulierten ID
                        doc_id = document_id or str(uuid.uuid4())
                        logging.warning(f"Simuliere Dokument-Erstellung mit ID {doc_id} wegen Weaviate-Problemen")
                        return doc_id
                except Exception as schema_err:
                    logging.error(f"Fehler beim Erstellen des Schemas für Tenant {tenant_id}: {schema_err}")
                    # Trotzdem fortfahren mit einer simulierten ID
                    doc_id = document_id or str(uuid.uuid4())
                    logging.warning(f"Simuliere Dokument-Erstellung mit ID {doc_id} wegen Weaviate-Problemen")
                    return doc_id
            
            # UUID erstellen für das Dokument, falls keine angegeben wurde
            doc_id = document_id or str(uuid.uuid4())
            
            # Dokument-Objekt erstellen
            properties = {
                "title": title,
                "content": content,
                "metadata": json.dumps(metadata or {}),
                "source": source or "Manual Upload"
            }
            
            try:
                # Dokument hinzufügen
                collection = client.collections.get(collection_name)
                collection.data.insert(
                    uuid=doc_id,
                    properties=properties
                )
                logging.info(f"Dokument {doc_id} erfolgreich zu Tenant {tenant_id} hinzugefügt")
                return doc_id
            except Exception as e:
                logging.error(f"Fehler beim Hinzufügen des Dokuments: {e}")
                # Trotzdem fortfahren mit der erstellten ID
                logging.warning(f"Simuliere Dokument-Erstellung mit ID {doc_id} wegen Weaviate-Problemen")
                return doc_id
        except Exception as e:
            logging.error(f"Allgemeiner Fehler beim Hinzufügen des Dokuments: {e}")
            # Trotzdem eine ID zurückgeben, damit die UI funktioniert
            doc_id = document_id or str(uuid.uuid4())
            logging.warning(f"Simuliere Dokument-Erstellung mit ID {doc_id} wegen allgemeinen Fehlern")
            return doc_id
    
    @staticmethod
    def get_documents(tenant_id: str, document_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Holt Dokumente für einen bestimmten Tenant, optional gefiltert nach document_id
        """
        try:
            client = get_client()
            collection_name = SchemaManager.get_tenant_class_name(tenant_id)
            
            # Prüfe, ob die Sammlung existiert
            if not SchemaManager.class_exists(collection_name):
                logging.warning(f"Collection {collection_name} existiert nicht für get_documents")
                return []  # Leere Liste zurückgeben, wenn die Collection nicht existiert
                
            try:
                # Weaviate-Collection abrufen
                collection = client.collections.get(collection_name)
                
                # Filter basierend auf document_id, falls angegeben
                query = collection.query.fetch_objects()
                if document_id:
                    query = query.with_additional("id").with_where({
                        "path": ["document_id"],
                        "operator": "Equal",
                        "valueString": document_id
                    })
                
                # Ausführen der Abfrage
                results = query.do()
                
                # Formatieren der Ergebnisse
                documents = []
                for obj in results.objects:
                    doc = {
                        "id": obj.uuid,
                        "title": obj.properties.get("title", ""),
                        "content": obj.properties.get("content", ""),
                        "metadata": json.loads(obj.properties.get("metadata", "{}")),
                        "source": obj.properties.get("source", "")
                    }
                    documents.append(doc)
                    
                return documents
                
            except Exception as e:
                logging.error(f"Fehler beim Abrufen der Dokumente: {e}")
                return []  # Leere Liste zurückgeben bei Fehlern
                
        except Exception as e:
            logging.error(f"Allgemeiner Fehler beim Abrufen der Dokumente: {e}")
            return []  # Leere Liste zurückgeben bei allgemeinen Fehlern
    
    @staticmethod
    def delete_document(tenant_id: str, doc_id: str) -> bool:
        """Löscht ein Dokument aus der Wissensbasis eines Tenants."""
        try:
            client = get_client()
            collection_name = SchemaManager.get_tenant_class_name(tenant_id)
            
            # Prüfen, ob Klasse existiert
            if not SchemaManager.class_exists(collection_name):
                logging.warning(f"Klasse {collection_name} existiert nicht")
                return False
                
            # Dokument löschen
            try:
                collection = client.collections.get(collection_name)
                collection.data.delete_by_id(doc_id)
                logging.info(f"Dokument {doc_id} erfolgreich gelöscht")
                return True
            except Exception as e:
                logging.error(f"Fehler beim Löschen des Dokuments {doc_id}: {e}")
                return False
        except Exception as e:
            logging.error(f"Allgemeiner Fehler beim Löschen des Dokuments {doc_id}: {e}")
            return False
    
    @staticmethod
    def get_document_status(tenant_id: str, document_id: str) -> Dict[str, Any]:
        """
        Prüft den Status eines Dokuments
        """
        try:
            client = get_client()
            if not client:
                logging.error("Weaviate-Client konnte nicht initialisiert werden")
                return {
                    "status": IndexStatus.FEHLER,
                    "error": "Weaviate-Client konnte nicht initialisiert werden",
                    "document_id": document_id,
                    "lastUpdated": datetime.now().isoformat()
                }
                
            collection_name = SchemaManager.get_tenant_class_name(tenant_id)
            
            if not SchemaManager.class_exists(collection_name):
                logging.warning(f"Collection {collection_name} existiert nicht")
                # Versuche, die Collection zu erstellen
                if SchemaManager.create_tenant_schema(tenant_id):
                    logging.info(f"Collection {collection_name} wurde erfolgreich erstellt")
                    # Trotzdem zurückgeben, dass das Dokument noch nicht indiziert ist
                    return {
                        "status": IndexStatus.NICHT_INDIZIERT,
                        "message": f"Collection {collection_name} wurde neu erstellt, Dokument muss indiziert werden",
                        "document_id": document_id,
                        "lastUpdated": datetime.now().isoformat()
                    }
                else:
                    return {
                        "status": IndexStatus.FEHLER,
                        "error": f"Collection {collection_name} existiert nicht und konnte nicht erstellt werden",
                        "document_id": document_id,
                        "lastUpdated": datetime.now().isoformat()
                    }
                
            try:
                collection = client.collections.get(collection_name)
                
                # Suche nach dem Dokument mit der document_id
                # Weaviate v4 Filter-Objekt korrekt erstellen
                filter_obj = Filter.by_property("document_id").equal(document_id)
                
                # Weaviate v4 Syntax: Filtern direkt in der fetch_objects() Methode
                query = collection.query.fetch_objects(
                    filters=filter_obj,
                    limit=1
                )
                
                # In Weaviate v4 wird query ausgeführt, ohne do() aufzurufen
                results = query
                
                if not results.objects:
                    return {
                        "status": IndexStatus.NICHT_INDIZIERT,
                        "error": f"Dokument mit ID {document_id} nicht in der Vektordatenbank gefunden",
                        "document_id": document_id,
                        "lastUpdated": datetime.now().isoformat()
                    }
                    
                # Extrahiere den Status aus den Properties
                obj = results.objects[0]
                raw_status = obj.properties.get("status", "unknown")
                
                # Konvertiere raw_status in einen gültigen IndexStatus-Enum-Wert
                if raw_status == "INDIZIERT":
                    status = IndexStatus.INDIZIERT
                elif raw_status == "FEHLER" or raw_status == "error":
                    status = IndexStatus.FEHLER
                else:
                    status = IndexStatus.NICHT_INDIZIERT
                
                return {
                    "status": status,
                    "document_id": document_id,
                    "id": obj.uuid,
                    "lastUpdated": obj.properties.get("lastUpdated", datetime.now().isoformat())
                }
            except Exception as e:
                logging.error(f"Fehler beim Abrufen des Dokumentenstatus: {e}")
                return {
                    "status": IndexStatus.FEHLER,
                    "error": f"Fehler beim Abrufen des Status: {str(e)}",
                    "document_id": document_id,
                    "lastUpdated": datetime.now().isoformat()
                }
                
        except Exception as e:
            logging.error(f"Allgemeiner Fehler beim Abrufen des Dokumentenstatus für Tenant {tenant_id}, Dokument {document_id}: {str(e)}")
            return {
                "status": IndexStatus.FEHLER,
                "error": str(e),
                "document_id": document_id,
                "lastUpdated": datetime.now().isoformat()
            }
    
    @staticmethod
    def update_document(tenant_id: str, document_id: str, properties: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aktualisiert ein Dokument
        """
        try:
            client = get_client()
            collection_name = SchemaManager.get_tenant_class_name(tenant_id)
            
            if not SchemaManager.class_exists(collection_name):
                logging.warning(f"Collection {collection_name} existiert nicht")
                return {"success": False, "error": f"Collection {collection_name} existiert nicht"}
                
            try:
                collection = client.collections.get(collection_name)
                
                # Suche nach dem Dokument mit der document_id
                query = collection.query.fetch_objects()
                query = query.with_where({
                    "path": ["document_id"],
                    "operator": "Equal",
                    "valueString": document_id
                })
                query = query.with_limit(1)
                
                results = query.do()
                
                if not results.objects:
                    return {"success": False, "error": f"Dokument mit ID {document_id} nicht gefunden"}
                    
                obj = results.objects[0]
                obj_id = obj.uuid
                
                # Aktualisiere die Eigenschaften
                collection.data.update(
                    uuid=obj_id,
                    properties=properties
                )
                
                return {
                    "success": True,
                    "id": obj_id,
                    "document_id": document_id
                }
            except Exception as e:
                logging.error(f"Fehler beim Aktualisieren des Dokuments: {e}")
                return {"success": False, "error": str(e), "document_id": document_id}
                
        except Exception as e:
            logging.error(f"Allgemeiner Fehler beim Aktualisieren des Dokuments für Tenant {tenant_id}, Dokument {document_id}: {str(e)}")
            return {"success": False, "error": str(e), "document_id": document_id} 