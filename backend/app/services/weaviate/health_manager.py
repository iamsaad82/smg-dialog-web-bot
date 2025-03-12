"""
Health-Manager-Modul für die Überwachung und Reparatur von Weaviate-Klassen.
"""

import logging
import asyncio
import json
from typing import Dict, Any, Optional, List, Tuple
import weaviate
import weaviate.classes as wvc
from .client import weaviate_client
from .schema_manager import SchemaManager

class HealthManager:
    """Manager für die Überwachung und Reparatur von Weaviate-Klassen."""
    
    @staticmethod
    async def validate_tenant_class(tenant_id: str) -> bool:
        """
        Überprüft, ob eine Tenant-Klasse existiert und valide ist.
        Bei Problemen wird versucht, die Klasse neu zu erstellen.
        """
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        try:
            # 1. Prüfen ob Klasse existiert
            if not SchemaManager.class_exists(class_name):
                logging.info(f"Klasse {class_name} existiert nicht, erstelle sie neu")
                return SchemaManager.create_tenant_schema(tenant_id)
            
            # 2. Validitätsprüfung: Versuche, ein Objekt zu erhalten
            try:
                # Testabfrage mit niedrigem Timeout
                collection = weaviate_client.collections.get(class_name)
                response = collection.query.fetch_objects(limit=1)
                
                # Wenn wir hier sind, ist die Abfrage erfolgreich
                logging.info(f"Klasse {class_name} ist valide")
                return True
                    
            except weaviate.exceptions.WeaviateQueryError as e:
                error_msg = str(e).lower()
                if "resolve node name" in error_msg or "status code: 500" in error_msg:
                    # Typischer Fehler bei defekten Klassen nach Container-Neustart
                    logging.warning(f"Erkannte beschädigte Klasse {class_name}, lösche und erstelle neu")
                    try:
                        # Klasse löschen
                        if SchemaManager.class_exists(class_name):
                            weaviate_client.collections.delete(class_name)
                            logging.info(f"Klasse {class_name} erfolgreich gelöscht")
                        
                        # Kurz warten und neu erstellen
                        await asyncio.sleep(1)
                        success = SchemaManager.create_tenant_schema(tenant_id)
                        if success:
                            logging.info(f"Klasse {class_name} neu erstellt")
                        return success
                    except Exception as delete_error:
                        logging.error(f"Fehler beim Löschen/Neuerstellen der Klasse: {delete_error}")
                        return False
                
                # Bei anderen Fehlern könnte die Klasse noch funktionieren
                logging.warning(f"Unbekannter Fehler bei Klassenprüfung: {e}")
                return True
                
            return True
                
        except Exception as e:
            logging.error(f"Fehler bei Klassenvalidierung für {class_name}: {e}")
            return False
    
    @staticmethod
    async def validate_all_tenant_classes() -> Tuple[int, int]:
        """
        Überprüft alle bestehenden Tenant-Klassen auf Validität.
        Gibt die Anzahl der geprüften und reparierten Klassen zurück.
        """
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return (0, 0)
        
        try:
            # Alle Klassen abrufen - in Weaviate 4.x hat collections kein list() mehr
            # Stattdessen verwenden wir die API direkt, um alle Sammlungen zu erhalten
            all_collections = []
            try:
                # In Weaviate 4.x können wir die collections API verwenden
                # Die Methode .get() ohne Parameter gibt alle Sammlungsnamen zurück
                # Alternativ können wir mit der REST-API direkten Zugriff erhalten
                
                # Direkte HTTP-Anfrage zur Schema-API
                import httpx
                weaviate_url = "http://weaviate:8080"  # Interne Docker-URL
                response = httpx.get(f"{weaviate_url}/v1/schema")
                if response.status_code == 200:
                    schema_data = response.json()
                    if "classes" in schema_data:
                        all_collections = [cls["class"] for cls in schema_data.get("classes", [])]
                        logging.info(f"Gefundene Klassen: {all_collections}")
                    else:
                        logging.warning("Keine Klassen im Schema gefunden")
                else:
                    logging.error(f"Fehler beim Abrufen des Schemas: {response.status_code}")
                    return (0, 0)
                    
            except Exception as schema_error:
                logging.error(f"Fehler beim Abrufen des Schemas: {schema_error}")
                return (0, 0)
            
            # Tenant-Klassen identifizieren
            tenant_classes = []
            for class_name in all_collections:
                if class_name.startswith("Tenant"):
                    tenant_classes.append(class_name)
            
            logging.info(f"Validiere {len(tenant_classes)} Tenant-Klassen")
            
            # Für jede Klasse
            problematic_classes = []
            for class_name in tenant_classes:
                # Extrahiere Tenant-ID aus dem Klassennamen
                if class_name.startswith("Tenant"):
                    tenant_id = class_name[6:]  # Entferne "Tenant" Präfix
                    
                    # Überprüfe, ob die Klasse valide ist
                    try:
                        # Test-Abfrage
                        collection = weaviate_client.collections.get(class_name)
                        collection.query.fetch_objects(limit=1)
                        
                        # Wenn wir hier sind, ist die Abfrage erfolgreich
                        logging.info(f"Klasse {class_name} ist valide")
                        
                    except weaviate.exceptions.WeaviateQueryError as e:
                        error_msg = str(e).lower()
                        if "resolve node name" in error_msg or "status code: 500" in error_msg:
                            logging.warning(f"Problematische Klasse gefunden: {class_name} - {e}")
                            problematic_classes.append((class_name, tenant_id))
                        else:
                            logging.warning(f"Unbekannter Fehler bei Klassenprüfung: {class_name} - {e}")
            
            # Reparatur problematischer Klassen
            repaired_count = 0
            for class_name, tenant_id in problematic_classes:
                logging.info(f"Repariere problematische Klasse: {class_name}")
                try:
                    # Klasse löschen
                    weaviate_client.collections.delete(class_name)
                    logging.info(f"Klasse {class_name} erfolgreich gelöscht")
                    
                    # Kurz warten und neu erstellen
                    await asyncio.sleep(1)
                    success = SchemaManager.create_tenant_schema(tenant_id)
                    if success:
                        logging.info(f"Klasse {class_name} neu erstellt")
                        repaired_count += 1
                except Exception as delete_error:
                    logging.error(f"Fehler beim Löschen der problematischen Klasse {class_name}: {delete_error}")
            
            logging.info(f"Validierung aller Tenant-Klassen abgeschlossen. {repaired_count} von {len(problematic_classes)} problematischen Klassen repariert.")
            return (len(tenant_classes), repaired_count)
            
        except Exception as e:
            logging.error(f"Fehler bei der Validierung der Tenant-Klassen: {e}")
            return (0, 0)
    
    @staticmethod
    async def reindex_document(document: Any) -> bool:
        """Ein Dokument in Weaviate neu indizieren"""
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return False
            
        try:
            tenant_id = document.tenant_id
            doc_id = document.id
            
            # Klassenstatus prüfen und bei Bedarf reparieren
            class_valid = await HealthManager.validate_tenant_class(tenant_id)
            if not class_valid:
                logging.error(f"Klasse für Tenant {tenant_id} konnte nicht validiert oder repariert werden")
                return False
            
            class_name = SchemaManager.get_tenant_class_name(tenant_id)
            collection = weaviate_client.collections.get(class_name)
            
            # Dokument-Objekt erstellen
            properties = {
                "title": document.title,
                "content": document.content,
                "metadata": document.doc_metadata or {},
                "source": document.source or "Manual Upload"
            }
            
            # Metadaten in JSON-String konvertieren
            if isinstance(properties["metadata"], dict):
                properties["metadata"] = json.dumps(properties["metadata"])
            
            try:
                # Prüfen, ob das Dokument existiert
                try:
                    obj = collection.query.fetch_object_by_id(doc_id)
                    exists = obj is not None
                except weaviate.exceptions.WeaviateQueryError:
                    # Bei Fehlern nehmen wir an, dass es nicht existiert
                    exists = False
                
                if exists:
                    # Dokument aktualisieren
                    logging.info(f"Aktualisiere bestehendes Dokument {doc_id}")
                    collection.data.update(
                        uuid=doc_id,
                        properties=properties
                    )
                else:
                    # Dokument erstellen
                    logging.info(f"Erstelle neues Dokument {doc_id}")
                    collection.data.insert(
                        uuid=doc_id,
                        properties=properties
                    )
                
                logging.info(f"Dokument {doc_id} aktualisiert/erstellt, warte auf Indizierung")
                
                # Warten und Status prüfen
                max_retries = 30
                for i in range(max_retries):
                    await asyncio.sleep(2)  # Alle 2 Sekunden prüfen
                    
                    try:
                        # Status abrufen
                        obj = collection.query.fetch_object_by_id(
                            uuid=doc_id,
                            include_vector=True
                        )
                        
                        if not obj:
                            logging.warning(f"Warnung: Dokument {doc_id} nicht gefunden")
                            continue
                        
                        # Prüfen, ob der Vektor existiert
                        vector_exists = obj.vector is not None
                        if vector_exists:
                            logging.info(f"Dokument {doc_id} erfolgreich indiziert")
                            return True
                    except Exception as e:
                        logging.warning(f"Fehler beim Prüfen des Indizierungsstatus (Versuch {i+1}): {e}")
                        await asyncio.sleep(3)  # Längere Pause bei Fehlern
                        continue
                    
                    logging.info(f"Status-Check {i+1}/{max_retries} für Dokument {doc_id}: Vektor wird erstellt...")
                
                logging.error(f"Timeout beim Warten auf Indizierung von Dokument {doc_id}")
                return False
                
            except Exception as e:
                logging.error(f"Fehler beim Neu-Indizieren des Dokuments {doc_id}: {e}")
                return False
                
            return True
                
        except Exception as e:
            logging.error(f"Fehler beim Neu-Indizieren des Dokuments: {e}")
            return False
    
    @staticmethod
    async def reindex_all_documents(tenant_id: str, documents: List[Any]) -> Tuple[int, int]:
        """
        Alle Dokumente eines Tenants neu indizieren.
        Gibt die Anzahl der Dokumente und die Anzahl der erfolgreich indizierten Dokumente zurück.
        """
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return (0, 0)
            
        try:
            total = len(documents)
            logging.info(f"Starte Neu-Indizierung von {total} Dokumenten für Tenant {tenant_id}")
            
            # Klassenstatus prüfen und bei Bedarf reparieren
            class_valid = await HealthManager.validate_tenant_class(tenant_id)
            if not class_valid:
                logging.error(f"Klasse für Tenant {tenant_id} konnte nicht validiert oder repariert werden")
                return (total, 0)
            
            # Dokumente indizieren
            success_count = 0
            for i, document in enumerate(documents, 1):
                try:
                    logging.info(f"Indiziere Dokument {i}/{total}: {document.title}")
                    success = await HealthManager.reindex_document(document)
                    if success:
                        logging.info(f"Dokument {i}/{total} erfolgreich neu indiziert")
                        success_count += 1
                    else:
                        logging.warning(f"Dokument {i}/{total} konnte nicht neu indiziert werden")
                except Exception as e:
                    logging.error(f"Fehler beim Neu-Indizieren von Dokument {document.title}: {e}")
                    # Weitermachen mit dem nächsten Dokument
                    continue
            
            logging.info(f"Alle Dokumente wurden verarbeitet. {success_count} von {total} erfolgreich indiziert.")
            return (total, success_count)
            
        except Exception as e:
            logging.error(f"Fehler beim Neu-Indizieren aller Dokumente: {e}")
            return (0, 0) 