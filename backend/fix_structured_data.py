#!/usr/bin/env python3
"""
Dieses Skript erstellt alle erforderlichen Schemas in Weaviate für die strukturierten Daten.
Es sollte einmalig ausgeführt werden, nachdem die Weaviate-Instanz gestartet wurde und bevor
Daten importiert werden.
"""

import logging
import sys
import os

# Den Pfad zum Projektverzeichnis hinzufügen, damit die Imports funktionieren
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.services.structured_data_service import StructuredDataService
from app.services.weaviate.client import weaviate_client
from app.db.session import SessionLocal
from app.db.models import Tenant, TenantModel

# Logger konfigurieren
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s:%(message)s')
logger = logging.getLogger(__name__)

def create_all_schemas(tenant_id=None):
    """
    Erstellt alle Schemas für strukturierte Daten in Weaviate.
    
    Args:
        tenant_id: Optional. Wenn angegeben, werden die Schemas nur für diesen Tenant erstellt.
                  Ansonsten werden sie für alle Tenants erstellt.
    """
    if weaviate_client is None:
        logger.error("Weaviate-Client ist nicht initialisiert. Prüfe deine Umgebungsvariablen.")
        return False
    
    if tenant_id:
        # Schemas für einen einzelnen Tenant erstellen
        logger.info(f"Erstelle Schemas für Tenant: {tenant_id}")
        success = create_schemas_for_tenant(tenant_id)
        return success
    else:
        # Schemas für alle Tenants erstellen
        logger.info("Erstelle Schemas für alle Tenants")
        db = SessionLocal()
        try:
            tenants = db.query(TenantModel).all()
            
            if not tenants:
                logger.warning("Keine Tenants in der Datenbank gefunden.")
                return False
            
            success = True
            for tenant in tenants:
                logger.info(f"Erstelle Schemas für Tenant: {tenant.id}")
                tenant_success = create_schemas_for_tenant(tenant.id)
                success = success and tenant_success
                
            return success
        finally:
            db.close()

def create_schemas_for_tenant(tenant_id):
    """
    Erstellt alle Schemas für einen bestimmten Tenant.
    
    Args:
        tenant_id: ID des Tenants
        
    Returns:
        bool: True, wenn alle Schemas erfolgreich erstellt wurden, sonst False
    """
    success = True
    for data_type in StructuredDataService.SUPPORTED_TYPES:
        logger.info(f"Erstelle Schema für Datentyp: {data_type}")
        schema_success = StructuredDataService.create_schema_for_type(tenant_id, data_type)
        if schema_success:
            logger.info(f"Schema für {data_type} erfolgreich erstellt oder existiert bereits.")
        else:
            logger.error(f"Fehler beim Erstellen des Schemas für {data_type}.")
            success = False
    
    return success

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Weaviate-Schemas für strukturierte Daten erstellen")
    parser.add_argument("--tenant", help="Tenant-ID (optional)", default=None)
    
    args = parser.parse_args()
    
    logger.info("Starte die Erstellung von Schemas für strukturierte Daten in Weaviate")
    
    if args.tenant:
        success = create_all_schemas(args.tenant)
    else:
        success = create_all_schemas()
    
    if success:
        logger.info("Alle Schemas wurden erfolgreich erstellt oder existieren bereits.")
    else:
        logger.error("Es gab Fehler beim Erstellen der Schemas.")
        sys.exit(1) 