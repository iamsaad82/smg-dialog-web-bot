"""
Skript zur Neuindizierung von Dokumenten in Weaviate.
Dieses Skript kann als eigenständiges Tool oder als Teil der Anwendung ausgeführt werden.
"""

import asyncio
import logging
import sys
from typing import List, Tuple, Any

from .health_manager import HealthManager

async def reindex_tenant_documents(tenant_id: str, documents: List[Any]) -> Tuple[int, int]:
    """
    Indiziert alle Dokumente eines Tenants neu.
    
    Args:
        tenant_id: Die ID des Tenants
        documents: Liste der Dokumente, die neu indiziert werden sollen
        
    Returns:
        Tuple[int, int]: (Anzahl der Dokumente, Anzahl der erfolgreich indizierten Dokumente)
    """
    logging.info(f"Starte Neuindizierung von {len(documents)} Dokumenten für Tenant {tenant_id}...")
    
    try:
        # Validiere die Tenant-Klasse
        class_valid = await HealthManager.validate_tenant_class(tenant_id)
        if not class_valid:
            logging.error(f"Tenant-Klasse für {tenant_id} konnte nicht validiert werden")
            return len(documents), 0
        
        # Indiziere alle Dokumente
        total, success = await HealthManager.reindex_all_documents(tenant_id, documents)
        
        logging.info(f"Neuindizierung abgeschlossen: {success} von {total} Dokumenten erfolgreich indiziert")
        return total, success
        
    except Exception as e:
        logging.error(f"Fehler bei der Neuindizierung der Dokumente: {e}")
        return len(documents), 0

if __name__ == "__main__":
    # Konfiguriere Logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Prüfe Argumente
    if len(sys.argv) < 2:
        print("Verwendung: python -m app.services.weaviate.reindex_documents <tenant_id>")
        sys.exit(1)
    
    tenant_id = sys.argv[1]
    
    # Hier müssten die Dokumente aus der Datenbank geladen werden
    # Da dies ein eigenständiges Skript ist, kann es nicht direkt auf die Datenbank zugreifen
    # Stattdessen sollte es in der Anwendung über die entsprechenden Dienste aufgerufen werden
    
    print(f"Dieses Skript sollte in der Anwendung über die entsprechenden Dienste aufgerufen werden.")
    print(f"Tenant-ID: {tenant_id}")
    
    # Beispiel für die Verwendung in der Anwendung:
    # from app.services.document_service import get_all_documents
    # documents = get_all_documents(tenant_id)
    # asyncio.run(reindex_tenant_documents(tenant_id, documents)) 