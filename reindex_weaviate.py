#!/usr/bin/env python
"""
Skript zur Neuindizierung aller Dokumente in Weaviate.
Dieses Skript sollte ausgeführt werden, wenn Probleme mit der Weaviate-Indizierung auftreten.
"""

import asyncio
import logging
import sys
import os
import httpx
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# Konfiguration des Loggings
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# API-Endpunkt und API-Key
API_BASE_URL = "https://api.dialog-ai-web.de/api/v1"
API_KEY = os.environ.get("DIALOG_AI_API_KEY")

async def reindex_tenant(tenant_id):
    """
    Startet den Neuindizierungsprozess für einen Tenant.
    """
    if not API_KEY:
        logging.error("Kein API-Key definiert. Exportiere DIALOG_AI_API_KEY.")
        return False
    
    # Endpunkt für die Neuindizierung
    url = f"{API_BASE_URL}/admin/maintenance/reindex-tenant/{tenant_id}"
    
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
    
    try:
        # API-Aufruf zur Neuindizierung
        logging.info(f"Starte Neuindizierung für Tenant {tenant_id}...")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                logging.info(f"Neuindizierung gestartet: {result}")
                return True
            else:
                logging.error(f"Fehler bei der Neuindizierung: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logging.error(f"Fehler beim API-Aufruf: {e}")
        return False

async def repair_document(tenant_id, doc_id):
    """
    Repariert ein einzelnes Dokument durch direkten API-Aufruf.
    """
    if not API_KEY:
        logging.error("Kein API-Key definiert. Exportiere DIALOG_AI_API_KEY.")
        return False
    
    # Endpunkt für die Dokumentenreparatur
    url = f"{API_BASE_URL}/admin/maintenance/reindex-document/{tenant_id}/{doc_id}"
    
    headers = {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY
    }
    
    try:
        # API-Aufruf zur Dokumentenreparatur
        logging.info(f"Repariere Dokument {doc_id} für Tenant {tenant_id}...")
        async with httpx.AsyncClient() as client:
            response = await client.post(url, headers=headers)
            
            if response.status_code == 200:
                result = response.json()
                logging.info(f"Dokumentenreparatur gestartet: {result}")
                return True
            else:
                logging.error(f"Fehler bei der Dokumentenreparatur: {response.status_code} - {response.text}")
                return False
    except Exception as e:
        logging.error(f"Fehler beim API-Aufruf: {e}")
        return False

async def main():
    """Hauptfunktion zum Starten der Neuindizierung."""
    # Prüfe Argumente
    if len(sys.argv) < 2:
        print("Verwendung:")
        print("  python reindex_weaviate.py tenant <tenant_id>")
        print("  python reindex_weaviate.py document <tenant_id> <document_id>")
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "tenant" and len(sys.argv) >= 3:
        tenant_id = sys.argv[2]
        success = await reindex_tenant(tenant_id)
        print(f"Neuindizierung für Tenant {tenant_id}: {'Erfolgreich gestartet' if success else 'Fehlgeschlagen'}")
    
    elif command == "document" and len(sys.argv) >= 4:
        tenant_id = sys.argv[2]
        doc_id = sys.argv[3]
        success = await repair_document(tenant_id, doc_id)
        print(f"Reparatur für Dokument {doc_id}: {'Erfolgreich gestartet' if success else 'Fehlgeschlagen'}")
    
    else:
        print("Ungültiger Befehl. Verwendung:")
        print("  python reindex_weaviate.py tenant <tenant_id>")
        print("  python reindex_weaviate.py document <tenant_id> <document_id>")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 