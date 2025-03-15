#!/usr/bin/env python3
"""
Manueller Brandenburg-Daten-Import

Dieses Skript führt einen manuellen Import der Brandenburg-Daten durch.
Es ist für die direkte Ausführung im Docker-Container konzipiert.

Verwendung:
    python manual_brandenburg_import.py
"""

import sys
import os
import logging
import json

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("manual_import")

# Weaviate-Datatype-Patch
def patch_weaviate_datatypes():
    """
    Patcht die Weaviate-Datentypen, falls nötig.
    In neueren Weaviate-Versionen wurde BOOLEAN zu BOOL.
    """
    try:
        from weaviate.classes.config import DataType
        
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
    except Exception as e:
        logger.error(f"Fehler beim Patchen der Weaviate-Datentypen: {e}")

def main():
    """Hauptfunktion"""
    logger.info("Starte manuellen Brandenburg-Daten-Import...")
    
    # Weaviate DataTypes patchen
    patch_weaviate_datatypes()
    
    try:
        # Korrigierte Import-Pfade für die Docker-Container-Umgebung
        from app.db.session import SessionLocal
        from app.db.models import TenantModel
        from app.services.structured_data_service import structured_data_service
        from app.services.weaviate import weaviate_service
        
        # Weaviate-Client initialisieren
        from app.services.weaviate.client import get_weaviate_client
        weaviate_client = get_weaviate_client()
        
        if not weaviate_client:
            logger.error("Weaviate-Client konnte nicht initialisiert werden")
            return

        # Alle Tenants mit Brandenburg-Flag finden
        db = SessionLocal()
        brandenburg_tenants = db.query(TenantModel).filter(TenantModel.is_brandenburg == True).all()
        
        if not brandenburg_tenants:
            logger.warning("Keine Tenants mit Brandenburg-Flag gefunden!")
            return
        
        logger.info(f"Gefunden: {len(brandenburg_tenants)} Brandenburg-Tenants")
        
        # Pfad zur lokalen Brandenburg-XML-Datei
        brandenburg_xml_path = "/app/downloaded_brandenburg.xml"
        
        # Prüfen, ob die Datei existiert
        if not os.path.exists(brandenburg_xml_path):
            logger.error(f"Die XML-Datei wurde nicht gefunden: {brandenburg_xml_path}")
            return
            
        logger.info(f"Verwende lokale XML-Datei: {brandenburg_xml_path}")
        
        # Daten für jeden Tenant importieren
        for tenant in brandenburg_tenants:
            tenant_id = str(tenant.id)
            tenant_name = tenant.name
            
            logger.info(f"Importiere Daten für Tenant: {tenant_name} (ID: {tenant_id})")
            
            try:
                # Daten importieren (lokale Datei statt URL)
                # Verwende die globale Instanz des structured_data_service
                result = structured_data_service.import_brandenburg_data(
                    xml_file_path=brandenburg_xml_path,
                    tenant_id=tenant_id
                )
                
                logger.info(f"Import für Tenant {tenant_name} abgeschlossen.")
                logger.info(f"Importierte Daten: {result}")
                
            except Exception as e:
                logger.error(f"Fehler beim Import für Tenant {tenant_name}: {str(e)}")
        
        logger.info("Brandenburg-Daten-Import abgeschlossen.")
        
    except Exception as e:
        logger.error(f"Unbehandelter Fehler: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())

if __name__ == "__main__":
    main() 