#!/usr/bin/env python3
"""
Brandenburg Structured Data Update Script

Dieses Skript aktualisiert die strukturierten Daten für Brandenburg-Tenants.
Es lädt die XML-Datei direkt von der Stadt-Brandenburg-Website herunter und
importiert Schulen, Ämter und Veranstaltungen in die Weaviate-Datenbank.

Verwendung:
    python update_structured_data.py
"""

import sys
import os
import logging
from pathlib import Path
import time

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("brandenburg_update")

# Projektroot finden und zum Python-Pfad hinzufügen
current_file = Path(__file__).resolve()
project_root = current_file.parent.parent
sys.path.insert(0, str(project_root))

# Benötigte Module importieren
try:
    from app.db.session import SessionLocal
    from app.models.tenant import Tenant
    from app.services.xml_parser_service import BrandenburgXMLParser
    from app.services.structured_data_service import StructuredDataService
    import weaviate
    from weaviate.classes.config import DataType
except ImportError as e:
    logger.error(f"Fehler beim Importieren der benötigten Module: {e}")
    sys.exit(1)

# URL der XML-Datei
BRANDENBURG_XML_URL = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"

def patch_weaviate_datatypes():
    """
    Patcht die Weaviate-Datentypen, falls nötig.
    In neueren Weaviate-Versionen wurde BOOLEAN zu BOOL.
    """
    # Überprüfen, ob BOOL oder BOOLEAN existiert
    datatypes = [attr for attr in dir(DataType) if not attr.startswith('_')]
    logger.info(f"Verfügbare DataType Enums: {datatypes}")
    
    if 'BOOLEAN' in datatypes and not 'BOOL' in datatypes:
        # Ältere Weaviate-Version, nichts zu tun
        logger.info("Verwende BOOLEAN DataType (ältere Weaviate-Version)")
    elif 'BOOL' in datatypes and not 'BOOLEAN' in datatypes:
        # Neuere Weaviate-Version, wo BOOLEAN nicht mehr existiert
        logger.info("Verwende BOOL DataType (neuere Weaviate-Version)")
    else:
        logger.info("Beide Datentypen existieren oder keiner existiert, kein Patching notwendig")

def get_brandenburg_tenants():
    """Holt alle Tenants mit Brandenburg-Flag aus der Datenbank."""
    try:
        db = SessionLocal()
        tenants = db.query(Tenant).filter(Tenant.is_brandenburg == True).all()
        db.close()
        return tenants
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Brandenburg-Tenants: {e}")
        return []

def update_tenant_data(tenant):
    """Aktualisiert die Daten für einen Brandenburg-Tenant."""
    tenant_id = str(tenant.id)
    tenant_name = tenant.name
    
    logger.info(f"Starte Import für Tenant: {tenant_name} (ID: {tenant_id})")
    
    try:
        # Daten importieren
        result = StructuredDataService.import_brandenburg_data_from_url(
            url=BRANDENBURG_XML_URL,
            tenant_id=tenant_id
        )
        
        # Ergebnisse protokollieren
        logger.info(f"Import für {tenant_name} abgeschlossen:")
        logger.info(f"  - Schulen: {result['schools']}")
        logger.info(f"  - Ämter: {result['offices']}")
        logger.info(f"  - Veranstaltungen: {result['events']}")
        
        total = result['schools'] + result['offices'] + result['events']
        return total
    except Exception as e:
        logger.error(f"Fehler beim Import für Tenant {tenant_name}: {e}")
        return 0

def main():
    """Hauptfunktion zum Ausführen des Updates."""
    start_time = time.time()
    logger.info("Starte Brandenburg Strukturdaten-Update...")
    
    # Weaviate DataTypes patchen
    patch_weaviate_datatypes()
    
    # Brandenburg-Tenants abrufen
    tenants = get_brandenburg_tenants()
    
    if not tenants:
        logger.warning("Keine Tenants mit Brandenburg-Flag gefunden!")
        sys.exit(0)
    
    logger.info(f"Gefunden: {len(tenants)} Brandenburg-Tenants")
    
    # Daten für jeden Tenant aktualisieren
    total_items = 0
    for tenant in tenants:
        items = update_tenant_data(tenant)
        total_items += items
    
    # Zusammenfassung
    elapsed_time = time.time() - start_time
    logger.info(f"Update abgeschlossen. Insgesamt {total_items} Einträge in {elapsed_time:.2f} Sekunden importiert.")

if __name__ == "__main__":
    main() 