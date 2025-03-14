#!/usr/bin/env python3
"""
Brandenburg XML-Import-Skript für den Produktiveinsatz

Dieses Skript importiert XML-Daten von der Stadt Brandenburg in die Weaviate-Datenbank.
Es ist für den Einsatz als Cronjob in der Produktivumgebung konzipiert.

Umgebungsvariablen:
- ADMIN_API_KEY: API-Key mit Admin-Rechten
- BRANDENBURG_XML_URL: URL zur Brandenburg XML-Datei (optional)
- LOG_LEVEL: Logging-Level (DEBUG, INFO, WARNING, ERROR) (optional)
"""

import os
import sys
import time
import logging
import traceback
import requests
from datetime import datetime
from typing import Dict, Optional
from pathlib import Path

# Root-Verzeichnis des Projekts
ROOT_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
sys.path.append(str(ROOT_DIR))

# Import der Projektmodule
from app.db.session import SessionLocal
from app.services.tenant_service import tenant_service

# Konfiguration des Loggings
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("brandenburg_xml_import")

# Konfigurationsvariablen
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")
BRANDENBURG_XML_URL = os.getenv("BRANDENBURG_XML_URL", "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml")
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
MAX_RETRIES = 3
RETRY_DELAY = 60  # Sekunden


def get_brandenburg_tenants() -> list:
    """
    Ermittelt alle Tenants mit aktivierter Brandenburg-Integration.
    
    Returns:
        list: Liste der Tenant-IDs mit aktivierter Brandenburg-Integration
    """
    try:
        db = SessionLocal()
        tenants = tenant_service.get_all_tenants(db)
        brandenburg_tenants = [t for t in tenants if getattr(t, 'is_brandenburg', False)]
        db.close()
        
        if not brandenburg_tenants:
            logger.warning("Keine Tenants mit aktivierter Brandenburg-Integration gefunden.")
            return []
            
        logger.info(f"{len(brandenburg_tenants)} Tenants mit Brandenburg-Integration gefunden.")
        return [str(t.id) for t in brandenburg_tenants]
        
    except Exception as e:
        logger.error(f"Fehler beim Abrufen der Brandenburg-Tenants: {str(e)}")
        return []


def import_brandenburg_data(url: str = BRANDENBURG_XML_URL) -> bool:
    """
    Importiert Brandenburg-Daten in die Weaviate-Datenbank.
    
    Args:
        url: URL zur Brandenburg XML-Datei
        
    Returns:
        bool: True, wenn der Import erfolgreich war, sonst False
    """
    if not ADMIN_API_KEY:
        logger.error("ADMIN_API_KEY ist nicht gesetzt. Import abgebrochen.")
        return False
    
    # Überprüfen, ob Tenants mit Brandenburg-Integration existieren
    tenants = get_brandenburg_tenants()
    if not tenants:
        logger.error("Keine Brandenburg-Tenants gefunden. Import abgebrochen.")
        return False
    
    logger.info(f"Starte Brandenburg XML-Import von URL: {url}")
    
    # API-Anfrage zum Import der Daten
    endpoint = f"{API_BASE_URL}/api/v1/structured-data/import/brandenburg/url"
    headers = {
        "Authorization": f"Bearer {ADMIN_API_KEY}",
        "Content-Type": "application/json",
        "User-Agent": "Brandenburg-XML-Import-Script/1.0"
    }
    payload = {"url": url}
    
    # Versuchen, mit Wiederholungen
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            logger.info(f"Import-Versuch {attempt}/{MAX_RETRIES}")
            response = requests.post(endpoint, headers=headers, json=payload, timeout=300)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Import erfolgreich: {result}")
                return True
            else:
                logger.error(f"Import fehlgeschlagen: Status {response.status_code} - {response.text}")
                
                # Bei Authentifizierungsproblemen sofort abbrechen
                if response.status_code in [401, 403]:
                    logger.error("Authentifizierungsproblem. Überprüfen Sie den ADMIN_API_KEY.")
                    return False
                    
                # Bei anderen Fehlern: Wiederholung, wenn nicht letzter Versuch
                if attempt < MAX_RETRIES:
                    logger.warning(f"Warte {RETRY_DELAY} Sekunden vor dem nächsten Versuch...")
                    time.sleep(RETRY_DELAY)
                
        except Exception as e:
            logger.error(f"Fehler beim API-Aufruf: {str(e)}")
            if attempt < MAX_RETRIES:
                logger.warning(f"Warte {RETRY_DELAY} Sekunden vor dem nächsten Versuch...")
                time.sleep(RETRY_DELAY)
    
    return False


def send_notification(success: bool, details: Optional[str] = None) -> None:
    """
    Sendet eine Benachrichtigung über den Status des Imports.
    In der Produktivumgebung kann diese Funktion erweitert werden,
    um E-Mails, Slack-Nachrichten oder andere Benachrichtigungen zu senden.
    
    Args:
        success: True, wenn der Import erfolgreich war, sonst False
        details: Optionale Details zur Benachrichtigung
    """
    status = "erfolgreich" if success else "fehlgeschlagen"
    message = f"Brandenburg XML-Import {status} am {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    if details:
        message += f"\nDetails: {details}"
    
    logger.info(f"Benachrichtigung: {message}")
    
    # Hier könnte Code für E-Mail-Versand, Slack-Benachrichtigung, etc. eingefügt werden


def main():
    """Hauptfunktion"""
    start_time = time.time()
    logger.info("Brandenburg XML-Import gestartet")
    
    try:
        success = import_brandenburg_data()
        
        duration = time.time() - start_time
        details = f"Dauer: {duration:.2f} Sekunden"
        
        send_notification(success, details)
        
        if success:
            logger.info(f"Brandenburg XML-Import erfolgreich abgeschlossen. {details}")
            return 0
        else:
            logger.error(f"Brandenburg XML-Import fehlgeschlagen. {details}")
            return 1
            
    except Exception as e:
        logger.error(f"Unbehandelter Fehler beim Brandenburg XML-Import: {str(e)}")
        logger.error(traceback.format_exc())
        
        send_notification(False, f"Unbehandelter Fehler: {str(e)}")
        return 2


if __name__ == "__main__":
    sys.exit(main()) 