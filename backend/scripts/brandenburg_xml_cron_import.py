#!/usr/bin/env python3
"""
Brandenburg XML Cron-Import

Dieses Skript ist für den automatisierten Import der Brandenburg-XML-Datei konzipiert.
Es führt folgende Schritte aus:
1. Herunterladen der XML-Datei mit angepasstem User-Agent (um 403-Fehler zu umgehen)
2. Prüfen, ob sich die Datei seit dem letzten Import geändert hat (MD5-Prüfsumme)
3. Bei Änderungen: Löschen aller existierenden strukturierten Daten für den Tenant
4. Import der neuen Daten

Verwendung:
    python brandenburg_xml_cron_import.py

Für den automatischen Aufruf durch Cron alle 24 Stunden:
    0 3 * * * docker exec smg-dialog-web-bot-backend-1 python /app/scripts/brandenburg_xml_cron_import.py
"""

import sys
import os
import logging
import hashlib
import json
import time
import tempfile
import requests
from datetime import datetime
from pathlib import Path

# Root-Verzeichnis des Projekts
ROOT_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
sys.path.append(str(ROOT_DIR))

# Konfiguration
XML_URL = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"
CHECKSUM_FILE = "/app/data/brandenburg_xml_checksum.json"
DOWNLOAD_PATH = "/app/data/brandenburg_latest.xml"
LOG_FILE = "/app/logs/brandenburg_xml_import.log"
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Verzeichnisse erstellen, falls nicht vorhanden
os.makedirs(os.path.dirname(CHECKSUM_FILE), exist_ok=True)
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("brandenburg_cron")

def download_xml(url=XML_URL, output_path=DOWNLOAD_PATH):
    """
    Lädt die XML-Datei mit angepasstem User-Agent herunter.
    
    Args:
        url: URL der XML-Datei
        output_path: Speicherpfad
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    logger.info(f"Starte Download der XML-Datei von {url}")
    
    try:
        response = requests.get(url, headers={
            'User-Agent': USER_AGENT
        }, timeout=120)
        
        if response.status_code != 200:
            logger.error(f"Fehler beim Download: HTTP-Statuscode {response.status_code}")
            return False
            
        with open(output_path, 'wb') as f:
            f.write(response.content)
            
        file_size = len(response.content)
        logger.info(f"XML-Datei erfolgreich heruntergeladen: {file_size} Bytes")
        return True
        
    except Exception as e:
        logger.error(f"Fehler beim Download der XML-Datei: {str(e)}")
        return False

def calculate_checksum(file_path):
    """
    Berechnet die MD5-Prüfsumme einer Datei.
    
    Args:
        file_path: Pfad zur Datei
        
    Returns:
        str: MD5-Prüfsumme oder None bei Fehler
    """
    try:
        with open(file_path, 'rb') as f:
            file_hash = hashlib.md5()
            # Datei in Blöcken lesen, um Speicherverbrauch zu reduzieren
            for chunk in iter(lambda: f.read(4096), b""):
                file_hash.update(chunk)
        return file_hash.hexdigest()
    except Exception as e:
        logger.error(f"Fehler bei der Berechnung der Prüfsumme: {str(e)}")
        return None

def has_file_changed(file_path):
    """
    Prüft, ob sich die Datei seit dem letzten Import geändert hat.
    
    Args:
        file_path: Pfad zur Datei
        
    Returns:
        bool: True, wenn sich die Datei geändert hat oder keine vorherige Prüfsumme existiert
    """
    current_checksum = calculate_checksum(file_path)
    if not current_checksum:
        return False
        
    # Prüfen, ob eine vorherige Prüfsumme existiert
    try:
        if os.path.exists(CHECKSUM_FILE):
            with open(CHECKSUM_FILE, 'r') as f:
                checksum_data = json.load(f)
                previous_checksum = checksum_data.get('checksum')
                
                if previous_checksum == current_checksum:
                    logger.info("Keine Änderungen in der XML-Datei festgestellt")
                    return False
        else:
            logger.info("Keine vorherige Prüfsumme gefunden, erste Import-Ausführung")
    except Exception as e:
        logger.error(f"Fehler beim Lesen der vorherigen Prüfsumme: {str(e)}")
    
    # Aktuelle Prüfsumme speichern
    try:
        with open(CHECKSUM_FILE, 'w') as f:
            json.dump({
                'checksum': current_checksum,
                'timestamp': datetime.now().isoformat()
            }, f)
        logger.info(f"Neue Prüfsumme gespeichert: {current_checksum}")
    except Exception as e:
        logger.error(f"Fehler beim Speichern der neuen Prüfsumme: {str(e)}")
    
    return True

def clear_existing_data(tenant_id):
    """
    Löscht alle existierenden strukturierten Daten für einen Tenant.
    
    Args:
        tenant_id: ID des Tenants
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    logger.info(f"Beginne Löschung existierender Daten für Tenant {tenant_id}")
    
    try:
        from app.services.structured_data_service import structured_data_service
        from app.services.structured_data_service import StructuredDataService
        from app.services.weaviate.client import weaviate_client
        
        if not weaviate_client:
            logger.error("Weaviate-Client konnte nicht initialisiert werden")
            return False
        
        deleted_count = 0
        
        # Für jeden unterstützten Datentyp die entsprechende Klasse löschen oder zurücksetzen
        for data_type in StructuredDataService.SUPPORTED_TYPES:
            class_name = StructuredDataService.get_class_name(tenant_id, data_type)
            
            try:
                # Prüfen, ob die Klasse existiert
                if weaviate_client.collections.exists(class_name):
                    # Alle Objekte in der Klasse löschen
                    collection = weaviate_client.collections.get(class_name)
                    
                    # Nur löschen, wenn Objekte existieren
                    if collection.objects.count() > 0:
                        # Lösche alle Objekte
                        deleted = collection.objects.delete_all()
                        deleted_count += deleted
                        logger.info(f"Gelöschte Objekte in {class_name}: {deleted}")
                else:
                    logger.info(f"Klasse {class_name} existiert nicht, keine Löschung erforderlich")
            except Exception as e:
                logger.error(f"Fehler beim Löschen der Daten vom Typ {data_type}: {str(e)}")
        
        logger.info(f"Insgesamt {deleted_count} strukturierte Daten-Objekte gelöscht")
        return True
        
    except Exception as e:
        logger.error(f"Fehler beim Löschen existierender Daten: {str(e)}")
        return False

def import_brandenburg_data(xml_file_path, tenant_id):
    """
    Importiert strukturierte Daten aus einer Brandenburg-XML-Datei.
    
    Args:
        xml_file_path: Pfad zur XML-Datei
        tenant_id: ID des Tenants
        
    Returns:
        dict: Importergebnisse oder None bei Fehler
    """
    logger.info(f"Starte Import der XML-Datei für Tenant {tenant_id}")
    
    try:
        from app.services.structured_data_service import structured_data_service
        
        # Daten importieren
        result = structured_data_service.import_brandenburg_data(
            xml_file_path=xml_file_path,
            tenant_id=tenant_id
        )
        
        # Ergebnisse protokollieren
        total = sum(result.values())
        logger.info(f"Import abgeschlossen: {total} Einträge importiert")
        
        for type_name, count in result.items():
            logger.info(f"  - {type_name}: {count}")
            
        return result
        
    except Exception as e:
        logger.error(f"Fehler beim Import der Brandenburg-Daten: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def get_brandenburg_tenants():
    """
    Ermittelt alle Tenants mit aktivierter Brandenburg-Integration.
    
    Returns:
        list: Liste der Tenant-IDs mit aktivierter Brandenburg-Integration
    """
    try:
        from app.db.session import SessionLocal
        from app.db.models import TenantModel
        
        db = SessionLocal()
        tenants = db.query(TenantModel).filter(TenantModel.is_brandenburg == True).all()
        db.close()
        
        if not tenants:
            logger.warning("Keine Tenants mit aktivierter Brandenburg-Integration gefunden.")
            return []
            
        logger.info(f"{len(tenants)} Tenants mit Brandenburg-Integration gefunden.")
        return [(str(t.id), t.name) for t in tenants]
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Brandenburg-Tenants: {str(e)}")
        return []

def main():
    """Hauptfunktion"""
    start_time = datetime.now()
    logger.info(f"Brandenburg XML Cron-Import gestartet: {start_time.isoformat()}")
    
    try:
        # XML-Datei herunterladen
        if not download_xml():
            logger.error("Abbruch: XML-Datei konnte nicht heruntergeladen werden")
            return 1
        
        # Prüfen, ob sich die Datei geändert hat
        if not has_file_changed(DOWNLOAD_PATH):
            logger.info("Keine Änderungen in der XML-Datei, kein Import erforderlich")
            return 0
        
        # Tenants mit Brandenburg-Flag abrufen
        brandenburg_tenants = get_brandenburg_tenants()
        
        if not brandenburg_tenants:
            logger.error("Abbruch: Keine Brandenburg-Tenants gefunden")
            return 1
        
        # Für jeden Tenant die Daten löschen und neu importieren
        for tenant_id, tenant_name in brandenburg_tenants:
            logger.info(f"Verarbeite Tenant: {tenant_name} (ID: {tenant_id})")
            
            # Existierende Daten löschen
            if not clear_existing_data(tenant_id):
                logger.warning(f"Konnte existierende Daten für Tenant {tenant_name} nicht vollständig löschen")
            
            # Neue Daten importieren
            import_result = import_brandenburg_data(DOWNLOAD_PATH, tenant_id)
            
            if not import_result:
                logger.error(f"Import für Tenant {tenant_name} fehlgeschlagen")
            else:
                logger.info(f"Import für Tenant {tenant_name} erfolgreich abgeschlossen")
        
        # Ausführungsdauer berechnen
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Brandenburg XML Cron-Import erfolgreich abgeschlossen. Dauer: {duration:.2f} Sekunden")
        
        return 0
        
    except Exception as e:
        logger.error(f"Unbehandelter Fehler: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return 1

if __name__ == "__main__":
    sys.exit(main()) 