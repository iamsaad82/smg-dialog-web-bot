#!/usr/bin/env python3
"""
Skript zum regelmäßigen Update der strukturierten Daten aus XML-Quellen.
"""

import os
import sys
import logging
from datetime import datetime
import argparse
import traceback

# Pfad zum Backend-Verzeichnis hinzufügen, um Importe zu ermöglichen
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_dir)

from app.db.session import get_db, SessionLocal
from app.db.models import Tenant
from app.services.structured_data_service import structured_data_service
from app.services.tenant_service import tenant_service

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(backend_dir, 'logs', 'update_structured_data.log'))
    ]
)
logger = logging.getLogger(__name__)

# Konstanten
TEMP_DIR = os.path.join(backend_dir, 'temp')

def download_and_import_xml(tenant_id, xml_url, xml_type="generic"):
    """
    Lädt eine XML-Datei herunter und importiert sie für einen Tenant.
    
    Args:
        tenant_id: ID des Tenants
        xml_url: URL der XML-Datei
        xml_type: Typ der XML-Datei (generic, brandenburg, etc.)
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    import requests
    import tempfile
    
    try:
        # Temporäres Verzeichnis erstellen, falls nicht vorhanden
        os.makedirs(TEMP_DIR, exist_ok=True)
        
        # Temporäre Datei für XML-Download erstellen
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.xml', dir=TEMP_DIR)
        temp_file_path = temp_file.name
        temp_file.close()
        
        logger.info(f"Starte Download von {xml_url} für Tenant {tenant_id}")
        
        # XML-Datei herunterladen
        response = requests.get(xml_url, stream=True, timeout=30)
        response.raise_for_status()
        
        with open(temp_file_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        logger.info(f"Download abgeschlossen: {temp_file_path}")
        
        # XML-Datei importieren
        import_stats = structured_data_service.import_xml_data(temp_file_path, tenant_id, xml_type)
        
        logger.info(f"Import für Tenant {tenant_id} abgeschlossen: {import_stats}")
        
        # Temporäre Datei löschen
        os.unlink(temp_file_path)
        
        return True
        
    except Exception as e:
        logger.error(f"Fehler beim Download/Import für Tenant {tenant_id}: {str(e)}")
        logger.error(traceback.format_exc())
        return False

def main():
    """Hauptfunktion zum Aktualisieren der strukturierten Daten aus XML-Quellen."""
    logger.info("Starte Update der strukturierten Daten")
    
    try:
        # Datenbankverbindung herstellen
        db = SessionLocal()
        
        # Tenant-Konfigurationen abrufen
        tenant_configs = db.query(Tenant).all()
        
        if not tenant_configs:
            logger.warning("Keine Tenants gefunden")
            return
        
        # XML-Daten für jeden Tenant aktualisieren
        for tenant in tenant_configs:
            # Prüfen, ob der Tenant einen spezifischen Renderer-Typ hat
            xml_type = "generic"
            if tenant.renderer_type != "default":
                xml_type = tenant.renderer_type
            
            # Prüfen, ob XML-URL in der Tenant-Konfiguration vorhanden ist
            config = tenant.config or {}
            xml_url = config.get("xml_url", "")
            
            if not xml_url:
                logger.info(f"Keine XML-URL für Tenant {tenant.id} konfiguriert, überspringe")
                continue
            
            logger.info(f"Aktualisiere strukturierte Daten für Tenant {tenant.id} mit XML-Typ {xml_type}")
            success = download_and_import_xml(tenant.id, xml_url, xml_type)
            
            if success:
                logger.info(f"Update für Tenant {tenant.id} erfolgreich")
            else:
                logger.error(f"Update für Tenant {tenant.id} fehlgeschlagen")
        
        db.close()
        logger.info("Update der strukturierten Daten abgeschlossen")
    
    except Exception as e:
        logger.error(f"Fehler beim Update der strukturierten Daten: {str(e)}")
        logger.error(traceback.format_exc())
        if 'db' in locals():
            db.close()

if __name__ == "__main__":
    # Kommandozeilenargumente parsen
    parser = argparse.ArgumentParser(description='Update strukturierte Daten aus XML-Quellen')
    parser.add_argument('--tenant', help='ID eines spezifischen Tenants (optional)')
    parser.add_argument('--url', help='URL der XML-Datei (optional, überschreibt Tenant-Konfiguration)')
    args = parser.parse_args()
    
    if args.tenant:
        # Update für einen spezifischen Tenant
        try:
            db = SessionLocal()
            tenant = db.query(Tenant).filter(Tenant.id == args.tenant).first()
            
            if not tenant:
                logger.error(f"Tenant mit ID {args.tenant} nicht gefunden")
                sys.exit(1)
            
            xml_type = "generic"
            if tenant.renderer_type != "default":
                xml_type = tenant.renderer_type
            
            xml_url = args.url or (tenant.config or {}).get("xml_url", "")
            
            if not xml_url:
                logger.error(f"Keine XML-URL für Tenant {args.tenant} angegeben")
                sys.exit(1)
            
            logger.info(f"Starte manuelles Update für Tenant {args.tenant}")
            success = download_and_import_xml(args.tenant, xml_url, xml_type)
            
            if success:
                logger.info(f"Manuelles Update für Tenant {args.tenant} erfolgreich")
            else:
                logger.error(f"Manuelles Update für Tenant {args.tenant} fehlgeschlagen")
                sys.exit(1)
                
            db.close()
        
        except Exception as e:
            logger.error(f"Fehler beim manuellen Update: {str(e)}")
            logger.error(traceback.format_exc())
            if 'db' in locals():
                db.close()
            sys.exit(1)
    else:
        # Update für alle Tenants
        main() 