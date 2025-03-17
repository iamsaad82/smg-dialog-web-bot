"""
Health-Manager-Modul für die Überwachung und Reparatur von Weaviate-Klassen.
"""

import logging
import asyncio
import json
import time
from typing import Dict, Any, Optional, List, Tuple
import weaviate
from sqlalchemy.orm import Session
from ...db.session import SessionLocal
from ...models.tenant import Tenant
from .client import get_client
from .schema_manager import SchemaManager
from weaviate.collections.classes.filters import Filter

class HealthManager:
    """
    Manager zur Überwachung der Integrität von Weaviate-Klassen und -Daten
    """
    
    @staticmethod
    def validate_tenant_class(tenant_id: str) -> bool:
        """
        Überprüft, ob die Tenant-Klasse existiert und repariert sie ggf.
        """
        client = get_client()
        if not client:
            logging.error("Weaviate-Client konnte nicht initialisiert werden")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        try:
            # Prüfe, ob die Klasse existiert
            if SchemaManager.class_exists(class_name):
                logging.info(f"Validierung erfolgreich: Klasse {class_name} existiert")
                return True
                
            # Wenn die Klasse nicht existiert, erstelle sie neu
            logging.warning(f"Klasse {class_name} existiert nicht, wird neu erstellt...")
            if SchemaManager.create_tenant_schema(tenant_id):
                logging.info(f"Klasse {class_name} erfolgreich erstellt")
                return True
            else:
                logging.error(f"Fehler beim Erstellen der Klasse {class_name}")
                return False
                
        except Exception as e:
            logging.error(f"Fehler beim Zugriff auf Klasse {class_name}: {str(e)}")
            try:
                # Versuche, die Klasse zu löschen und neu zu erstellen
                logging.warning(f"Versuche, Klasse {class_name} zu löschen und neu zu erstellen...")
                try:
                    # Weaviate v4 API zum Löschen von Collections
                    client.collections.delete(class_name)
                    logging.info(f"Klasse {class_name} erfolgreich gelöscht")
                    time.sleep(1)  # Warte kurz, bis Weaviate die Änderung verarbeitet hat
                except Exception as delete_collection_error:
                    logging.error(f"Fehler beim Löschen der Collection {class_name}: {str(delete_collection_error)}")
                
                # Versuche erneut, die Klasse zu erstellen
                if SchemaManager.create_tenant_schema(tenant_id):
                    logging.info(f"Klasse {class_name} erfolgreich neu erstellt")
                    return True
                else:
                    logging.error(f"Fehler beim erneuten Erstellen der Klasse {class_name}")
                    return False
            except Exception as delete_error:
                logging.error(f"Fehler beim Löschen/Neuerstellen der Klasse {class_name}: {str(delete_error)}")
                
            return False
            
    @staticmethod
    def validate_all_tenant_classes() -> Tuple[int, int]:
        """
        Überprüft alle Tenant-Klassen für alle bekannten Tenants
        """
        # Verbinde mit der Datenbank, um alle Tenant-IDs zu holen
        db = SessionLocal()
        try:
            # Nur die ID-Spalte abfragen, um Probleme mit fehlenden Spalten zu vermeiden
            tenants = db.query(Tenant.id).all()
            tenant_ids = [str(tenant.id) for tenant in tenants]
        except Exception as e:
            logging.error(f"Fehler beim Abrufen der Tenants aus der Datenbank: {str(e)}")
            tenant_ids = []
        finally:
            db.close()
            
        if not tenant_ids:
            logging.warning("Keine Tenants in der Datenbank gefunden")
            return 0, 0
            
        checked = 0
        repaired = 0
        
        for tenant_id in tenant_ids:
            checked += 1
            if not HealthManager.validate_tenant_class(tenant_id):
                # Versuche, die Klasse zu reparieren
                if SchemaManager.create_tenant_schema(tenant_id):
                    logging.info(f"Klasse für Tenant {tenant_id} erfolgreich repariert")
                    repaired += 1
                else:
                    logging.error(f"Reparatur der Klasse für Tenant {tenant_id} fehlgeschlagen")
                    
        return checked, repaired
        
    @staticmethod
    def reindex_document(tenant_id: str, document_id: str, document_data: Dict[str, Any]) -> bool:
        """
        Indiziert ein Dokument neu
        """
        client = get_client()
        if not client:
            logging.error("Weaviate-Client konnte nicht initialisiert werden")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        try:
            # Prüfen, ob die Collection existiert. Falls nicht, erstellen wir sie.
            if not SchemaManager.class_exists(class_name):
                logging.warning(f"Collection {class_name} existiert nicht, wird erstellt...")
                if not SchemaManager.create_tenant_schema(tenant_id):
                    logging.error(f"Erstellen der Collection {class_name} fehlgeschlagen")
                    return False
                logging.info(f"Collection {class_name} erfolgreich erstellt")
                    
            try:
                collection = client.collections.get(class_name)
                
                # Stelle sicher, dass die Daten das richtige Format haben
                # Kopiere die Daten, um das Original nicht zu ändern
                properties_to_insert = document_data.copy()
                
                # Sicherstellen, dass obligatorische Felder vorhanden sind
                properties_to_insert["document_id"] = document_id
                properties_to_insert["tenant_id"] = tenant_id
                properties_to_insert["status"] = "INDIZIERT"
                
                # Prüfen, ob Metadaten als String oder Dict vorliegen
                if "metadata" in properties_to_insert and not isinstance(properties_to_insert["metadata"], str):
                    try:
                        properties_to_insert["metadata"] = json.dumps(properties_to_insert["metadata"])
                    except Exception as json_error:
                        logging.warning(f"Fehler beim Konvertieren von Metadaten zu JSON: {str(json_error)}")
                        properties_to_insert["metadata"] = "{}"
                
                # Wir versuchen, bestehende Dokumente mit dieser ID zu löschen
                try:
                    # Weaviate v4 Filter-Objekt korrekt erstellen
                    filter_obj = Filter.by_property("document_id").equal(document_id)
                    
                    # Dokumente mit dem Filter suchen - in v4 ist do() nicht mehr nötig
                    query_result = collection.query.fetch_objects(
                        filters=filter_obj,
                        limit=100
                    )
                    
                    # Wenn Objekte gefunden wurden, löschen wir sie
                    if hasattr(query_result, 'objects') and query_result.objects:
                        for obj in query_result.objects:
                            try:
                                collection.data.delete_by_id(obj.uuid)
                                logging.info(f"Bestehendes Dokument {obj.uuid} für document_id {document_id} gelöscht")
                            except Exception as obj_delete_error:
                                logging.warning(f"Fehler beim Löschen eines Objekts: {str(obj_delete_error)}")
                except Exception as delete_error:
                    logging.warning(f"Fehler beim Löschen bestehender Dokumente: {str(delete_error)}")
                    # Wir setzen fort, auch wenn das Löschen fehlschlägt
                
                # Füge das neue Dokument hinzu
                try:
                    # UUID für das neue Objekt generieren, wenn nicht in den Daten vorhanden
                    uuid_to_use = None  # Lasse Weaviate die UUID generieren
                    
                    # Entferne UUID aus properties wenn vorhanden, da sie als separater Parameter übergeben wird
                    if "uuid" in properties_to_insert:
                        uuid_to_use = properties_to_insert.pop("uuid", None)
                    
                    # Neues Objekt einfügen
                    insert_result = collection.data.insert(
                        properties=properties_to_insert,
                        uuid=uuid_to_use
                    )
                    
                    logging.info(f"Dokument {document_id} für Tenant {tenant_id} erfolgreich neu indiziert")
                    return True
                except Exception as insert_error:
                    logging.error(f"Fehler beim Einfügen des Dokuments {document_id}: {str(insert_error)}")
                    return False
            except Exception as collection_error:
                logging.error(f"Fehler beim Zugriff auf die Collection {class_name}: {str(collection_error)}")
                return False
        except Exception as e:
            logging.error(f"Fehler beim Neuindizieren des Dokuments {document_id}: {str(e)}")
            return False
            
    @staticmethod
    def reindex_all_documents(tenant_id: str, documents: List[Dict[str, Any]]) -> int:
        """
        Indiziert alle Dokumente eines Tenants neu
        """
        success_count = 0
        
        for doc in documents:
            document_id = doc.get("document_id")
            if not document_id:
                logging.warning("Dokument ohne document_id gefunden, wird übersprungen")
                continue
                
            if HealthManager.reindex_document(tenant_id, document_id, doc):
                success_count += 1
                
        logging.info(f"{success_count} von {len(documents)} Dokumenten für Tenant {tenant_id} erfolgreich neuindiziert")
        return success_count 