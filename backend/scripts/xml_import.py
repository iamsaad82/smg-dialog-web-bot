#!/usr/bin/env python3
"""
XML-Import-Skript für verschiedene Datenquellen

Dieses Skript importiert XML-Daten aus verschiedenen Quellen in die Weaviate-Datenbank.
Es unterstützt verschiedene XML-Formate durch verschiedene Parser-Implementierungen.

Verwendung:
    python xml_import.py --url <URL> --tenant <TENANT_ID> --type <XML_TYPE>
    python xml_import.py --file <DATEIPFAD> --tenant <TENANT_ID> --type <XML_TYPE>

Beispiele:
    python xml_import.py --url https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml --tenant 9d8d5dcf-f6b3-4d06-8016-0f24869f8872 --type stadt
    python xml_import.py --file /pfad/zur/datei.xml --tenant 9d8d5dcf-f6b3-4d06-8016-0f24869f8872 --type generic

Parameter:
    --url URL          URL der XML-Datei
    --file FILE        Pfad zur XML-Datei
    --tenant TENANT_ID ID des Tenants
    --type XML_TYPE    Typ der XML-Daten (generic, stadt, etc.)
    --cron             Als Cron-Job ausführen (prüft Änderungen)
    --force            Erzwingt den Import, auch wenn keine Änderungen erkannt wurden

Umgebungsvariablen:
    - XML_URL: URL zur XML-Datei (optional)
    - LOG_LEVEL: Logging-Level (DEBUG, INFO, WARNING, ERROR) (optional)
"""

import os
import sys
import time
import logging
import argparse
import hashlib
import json
import tempfile
import requests
import traceback
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path

# Root-Verzeichnis des Projekts
ROOT_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
sys.path.append(str(ROOT_DIR))

# Import der Projektmodule
from app.db.session import SessionLocal
from app.services.tenant_service import tenant_service
from app.services.structured_data_service import structured_data_service

# Konfiguration des Loggings
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("xml_import")

# Konfigurationsvariablen
DEFAULT_XML_URL = os.getenv("XML_URL", "")
CHECKSUM_DIR = os.getenv("CHECKSUM_DIR", "/app/data")
LOG_DIR = os.getenv("LOG_DIR", "/app/logs")
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Verzeichnisse erstellen, falls nicht vorhanden
os.makedirs(CHECKSUM_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

def get_checksum_file(tenant_id: str, xml_type: str) -> str:
    """
    Generiert den Pfad zur Checksum-Datei für einen Tenant und XML-Typ.
    
    Args:
        tenant_id: ID des Tenants
        xml_type: Typ der XML-Daten
        
    Returns:
        str: Pfad zur Checksum-Datei
    """
    return os.path.join(CHECKSUM_DIR, f"xml_checksum_{tenant_id}_{xml_type}.json")

def get_download_path(tenant_id: str, xml_type: str) -> str:
    """
    Generiert den Pfad zur heruntergeladenen XML-Datei für einen Tenant und XML-Typ.
    
    Args:
        tenant_id: ID des Tenants
        xml_type: Typ der XML-Daten
        
    Returns:
        str: Pfad zur XML-Datei
    """
    return os.path.join(CHECKSUM_DIR, f"xml_data_{tenant_id}_{xml_type}.xml")

def download_xml(url: str, output_path: str) -> bool:
    """
    Lädt eine XML-Datei mit angepasstem User-Agent herunter.
    
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

def has_file_changed(file_path: str, tenant_id: str, xml_type: str) -> bool:
    """
    Prüft, ob sich die XML-Datei seit dem letzten Import geändert hat.
    
    Args:
        file_path: Pfad zur XML-Datei
        tenant_id: ID des Tenants
        xml_type: Typ der XML-Daten
        
    Returns:
        bool: True, wenn sich die Datei geändert hat, sonst False
    """
    checksum_file = get_checksum_file(tenant_id, xml_type)
    
    try:
        # Aktuelle Prüfsumme der XML-Datei berechnen
        with open(file_path, 'rb') as f:
            current_checksum = hashlib.md5(f.read()).hexdigest()
            
        # Gespeicherte Prüfsumme abrufen (falls vorhanden)
        if os.path.exists(checksum_file):
            with open(checksum_file, 'r') as f:
                checksum_data = json.load(f)
                last_checksum = checksum_data.get('checksum', '')
                last_import = checksum_data.get('last_import', 'unbekannt')
                
            if current_checksum == last_checksum:
                logger.info(f"XML-Datei hat sich seit dem letzten Import ({last_import}) nicht geändert")
                return False
                
        # Prüfsumme speichern
        with open(checksum_file, 'w') as f:
            json.dump({
                'checksum': current_checksum,
                'last_import': datetime.now().isoformat()
            }, f)
            
        logger.info("XML-Datei hat sich seit dem letzten Import geändert")
        return True
        
    except Exception as e:
        logger.error(f"Fehler beim Prüfen der Dateiveränderung: {str(e)}")
        return True  # Im Zweifelsfall immer importieren

def import_xml_from_file(file_path: str, tenant_id: str, xml_type: str) -> Dict[str, int]:
    """
    Importiert eine XML-Datei für einen Tenant.
    
    Args:
        file_path: Pfad zur XML-Datei
        tenant_id: ID des Tenants
        xml_type: Typ der XML-Daten
        
    Returns:
        Dict[str, int]: Ergebnis des Imports (Anzahl der importierten Einträge pro Typ)
    """
    logger.info(f"Starte Import der XML-Datei für Tenant {tenant_id}, XML-Typ: {xml_type}")
    
    try:
        # Daten importieren
        result = structured_data_service.import_xml_data(
            xml_file_path=file_path,
            tenant_id=tenant_id,
            xml_type=xml_type
        )
        
        if not result:
            logger.error("Import fehlgeschlagen (None zurückgegeben)")
            return {}
        
        # Ergebnisse protokollieren
        data_types = [key for key, value in result.items() if value > 0]
        total = sum(result.values())
        logger.info(f"Import abgeschlossen: {total} Einträge in {len(data_types)} Typen importiert")
        
        for type_name, count in result.items():
            if count > 0:
                logger.info(f"  - {type_name}: {count}")
            
        return result
        
    except Exception as e:
        logger.error(f"Fehler beim XML-Import: {str(e)}")
        logger.error(traceback.format_exc())
        return {}

def import_xml_from_url(url: str, tenant_id: str, xml_type: str, force: bool = False) -> Dict[str, int]:
    """
    Lädt eine XML-Datei von einer URL herunter und importiert sie.
    
    Args:
        url: URL der XML-Datei
        tenant_id: ID des Tenants
        xml_type: Typ der XML-Daten
        force: Erzwingt den Import, auch wenn keine Änderungen erkannt wurden
        
    Returns:
        Dict[str, int]: Ergebnis des Imports
    """
    download_path = get_download_path(tenant_id, xml_type)
    
    # XML-Datei herunterladen
    if not download_xml(url, download_path):
        logger.error("Abbruch: XML-Datei konnte nicht heruntergeladen werden")
        return {}
    
    # Prüfen, ob sich die Datei geändert hat
    if not force and not has_file_changed(download_path, tenant_id, xml_type):
        logger.info("Keine Änderungen in der XML-Datei, kein Import erforderlich")
        return {}
    
    # XML-Daten importieren
    return import_xml_from_file(download_path, tenant_id, xml_type)

def cron_job(url: str, tenant_ids: List[str], xml_type: str, force: bool = False) -> Dict[str, Dict[str, int]]:
    """
    Führt einen Cron-Job aus, der XML-Daten für mehrere Tenants importiert.
    
    Args:
        url: URL der XML-Datei
        tenant_ids: Liste der Tenant-IDs
        xml_type: Typ der XML-Daten
        force: Erzwingt den Import, auch wenn keine Änderungen erkannt wurden
        
    Returns:
        Dict[str, Dict[str, int]]: Ergebnisse des Imports pro Tenant
    """
    logger.info(f"Starte XML-Cron-Import von {url} für {len(tenant_ids)} Tenants")
    
    results = {}
    
    for tenant_id in tenant_ids:
        tenant = tenant_service.get_tenant_by_id(SessionLocal(), tenant_id)
        if not tenant:
            logger.warning(f"Tenant mit ID {tenant_id} nicht gefunden, überspringe")
            continue
            
        logger.info(f"Verarbeite Tenant: {tenant.name} (ID: {tenant_id})")
        
        # XML-Daten importieren
        result = import_xml_from_url(url, tenant_id, xml_type, force)
        
        if result:
            results[tenant.name] = result
        else:
            results[tenant.name] = {"error": "Import fehlgeschlagen"}
    
    return results

def main():
    """Hauptfunktion"""
    parser = argparse.ArgumentParser(description="XML-Import-Skript")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('--url', help='URL der XML-Datei')
    group.add_argument('--file', help='Pfad zur XML-Datei')
    parser.add_argument('--tenant', help='ID des Tenants (kommagetrennt für mehrere)', required=True)
    parser.add_argument('--type', help='Typ der XML-Daten (generic, stadt, etc.)', default="generic")
    parser.add_argument('--cron', action='store_true', help='Als Cron-Job ausführen (prüft Änderungen)')
    parser.add_argument('--force', action='store_true', help='Erzwingt den Import, auch wenn keine Änderungen erkannt wurden')
    
    args = parser.parse_args()
    
    start_time = datetime.now()
    logger.info(f"XML-Import gestartet: {start_time.isoformat()}")
    
    # Tenant-IDs aufteilen, falls mehrere angegeben wurden
    tenant_ids = [tenant_id.strip() for tenant_id in args.tenant.split(',') if tenant_id.strip()]
    
    try:
        if args.url:
            if args.cron:
                # Cron-Job-Modus: Importiere für alle angegebenen Tenants
                results = cron_job(args.url, tenant_ids, args.type, args.force)
                
                # Zusammenfassung ausgeben
                logger.info(f"XML-Cron-Import abgeschlossen. Ergebnisse:")
                for tenant_name, result in results.items():
                    if "error" in result:
                        logger.info(f"  - {tenant_name}: {result['error']}")
                    else:
                        total = sum(result.values())
                        logger.info(f"  - {tenant_name}: {total} Einträge importiert")
            else:
                # Normaler Modus: Importiere für jeden Tenant einzeln
                results = {}
                for tenant_id in tenant_ids:
                    result = import_xml_from_url(args.url, tenant_id, args.type, args.force)
                    if result:
                        results[tenant_id] = result
                    else:
                        results[tenant_id] = {"error": "Import fehlgeschlagen"}
                        
                # Zusammenfassung ausgeben
                logger.info(f"XML-Import abgeschlossen. Ergebnisse:")
                for tenant_id, result in results.items():
                    if "error" in result:
                        logger.info(f"  - Tenant {tenant_id}: {result['error']}")
                    else:
                        total = sum(result.values())
                        logger.info(f"  - Tenant {tenant_id}: {total} Einträge importiert")
        else:
            # Importiere aus lokaler Datei
            results = {}
            for tenant_id in tenant_ids:
                result = import_xml_from_file(args.file, tenant_id, args.type)
                if result:
                    results[tenant_id] = result
                else:
                    results[tenant_id] = {"error": "Import fehlgeschlagen"}
                    
            # Zusammenfassung ausgeben
            logger.info(f"XML-Import aus Datei abgeschlossen. Ergebnisse:")
            for tenant_id, result in results.items():
                if "error" in result:
                    logger.info(f"  - Tenant {tenant_id}: {result['error']}")
                else:
                    total = sum(result.values())
                    logger.info(f"  - Tenant {tenant_id}: {total} Einträge importiert")
        
        # Ausführungsdauer berechnen
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        logger.info(f"XML-Import erfolgreich abgeschlossen. Dauer: {duration:.2f} Sekunden")
        
        return 0
        
    except Exception as e:
        logger.error(f"Unbehandelter Fehler: {str(e)}")
        logger.error(traceback.format_exc())
        return 1

if __name__ == "__main__":
    sys.exit(main()) 