#!/usr/bin/env python3
import asyncio
import json
import logging
import os
import sys
import uuid
import requests
from sqlalchemy import create_engine, text
from datetime import datetime

# Konfiguration
TENANT_ID = "3622a3a8-b6b1-4c93-80e9-b4ac0b31cb5b"
WEAVIATE_URL = "http://weaviate:8080"
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/smg_dialog")

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def get_documents_from_db(tenant_id):
    """Dokumente aus der Datenbank abrufen"""
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as connection:
            query = text("""
                SELECT id, title, content, metadata, source, tenant_id
                FROM documents
                WHERE tenant_id = :tenant_id
            """)
            result = connection.execute(query, {"tenant_id": tenant_id})
            documents = []
            for row in result:
                documents.append({
                    "id": str(row.id),
                    "title": row.title,
                    "content": row.content,
                    "metadata": row.metadata,
                    "source": row.source,
                    "tenant_id": str(row.tenant_id)
                })
            return documents
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Dokumente aus der Datenbank: {e}")
        return []

def check_schema_exists(class_name):
    """Überprüfen, ob das Schema in Weaviate existiert"""
    try:
        response = requests.get(f"{WEAVIATE_URL}/v1/schema/{class_name}")
        return response.status_code == 200
    except Exception as e:
        logger.error(f"Fehler beim Überprüfen des Schemas: {e}")
        return False

def count_documents_in_weaviate(class_name):
    """Anzahl der Dokumente in Weaviate zählen"""
    try:
        response = requests.get(f"{WEAVIATE_URL}/v1/objects?class={class_name}&limit=1")
        if response.status_code == 200:
            # Wir können die Gesamtzahl nicht direkt bekommen, aber wir können prüfen, ob Objekte vorhanden sind
            data = response.json()
            if "objects" in data:
                return len(data["objects"])
        return 0
    except Exception as e:
        logger.error(f"Fehler beim Zählen der Dokumente in Weaviate: {e}")
        return 0

def import_document_to_weaviate(class_name, document):
    """Ein Dokument in Weaviate importieren"""
    try:
        # Wir verwenden die UUID aus der Datenbank als ID in Weaviate
        doc_id = document["id"]
        
        # Dokument für Weaviate vorbereiten
        weaviate_doc = {
            "class": class_name,
            "id": doc_id,
            "properties": {
                "title": document["title"] or "",
                "content": document["content"] or "",
                "metadata": document["metadata"] or "",
                "source": document["source"] or ""
            }
        }
        
        # Dokument in Weaviate importieren
        response = requests.post(
            f"{WEAVIATE_URL}/v1/objects",
            json=weaviate_doc,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code in [200, 201]:
            return True
        else:
            logger.error(f"Fehler beim Import von {document['title']}: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Fehler beim Import von {document.get('title', 'unbekannt')}: {e}")
        return False

async def import_documents_for_tenant(tenant_id):
    """Alle Dokumente für einen Tenant in Weaviate importieren"""
    logger.info(f"Importiere Dokumente für Tenant {tenant_id}...")
    
    # Klasse für den Tenant
    class_name = f"Tenant{tenant_id.replace('-', '')}"
    
    # Dokumente aus der Datenbank abrufen
    documents = get_documents_from_db(tenant_id)
    logger.info(f"Gefundene Dokumente in der Datenbank: {len(documents)}")
    
    if not documents:
        logger.warning("Keine Dokumente gefunden. Import wird abgebrochen.")
        return
    
    # Überprüfen, ob das Schema existiert
    if not check_schema_exists(class_name):
        logger.error(f"Schema {class_name} existiert nicht in Weaviate. Bitte erstellen Sie es zuerst.")
        return
    
    # Dokumente importieren
    successful_imports = 0
    failed_imports = 0
    
    for i, document in enumerate(documents, 1):
        logger.info(f"Importiere Dokument {document['id']}: {document['title']}")
        success = import_document_to_weaviate(class_name, document)
        
        if success:
            successful_imports += 1
        else:
            failed_imports += 1
    
    # Ergebnisse ausgeben
    logger.info("\nImport abgeschlossen:")
    logger.info(f"  Erfolgreich importiert: {successful_imports}")
    logger.info(f"  Fehler: {failed_imports}")
    
    # Anzahl der Dokumente in Weaviate nach dem Import
    docs_in_weaviate = count_documents_in_weaviate(class_name)
    logger.info(f"  Dokumente in Weaviate nach Import: {docs_in_weaviate}")
    
    logger.info("Import abgeschlossen!")

async def main():
    """Hauptfunktion"""
    logger.info("Starte Import von Dokumenten in Weaviate...")
    await import_documents_for_tenant(TENANT_ID)

if __name__ == "__main__":
    asyncio.run(main()) 