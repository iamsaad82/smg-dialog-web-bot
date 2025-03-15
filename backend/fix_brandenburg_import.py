#!/usr/bin/env python3
"""
Fix Brandenburg Import

Dieses Skript führt einen manuellen Import der Brandenburg-XML-Datei durch,
um Probleme mit dem strukturierten Daten zu beheben.
"""

import sys
import os
import logging
import requests
from pathlib import Path

# Root-Verzeichnis des Projekts
ROOT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(str(ROOT_DIR))

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def download_xml_data(url):
    """
    Lädt die XML-Daten von der angegebenen URL herunter und gibt sie als String zurück.
    Verwendet verschiedene User-Agent-Header, um 403 Forbidden zu vermeiden.
    """
    # Liste von User-Agent-Headern, die wir versuchen können
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0'
    ]
    
    # Liste von alternativen URLs, falls die Haupturl nicht funktioniert
    alternative_urls = [
        url,
        "https://www.stadt-brandenburg.de/fileadmin/chatbot/daten.xml",
        "https://www.stadt-brandenburg.de/fileadmin/daten/chatbot/daten.xml",
        "https://www.stadt-brandenburg.de/chatbot/daten.xml"
    ]
    
    # Versuche alle URLs mit verschiedenen User-Agents
    for try_url in alternative_urls:
        for agent in user_agents:
            headers = {'User-Agent': agent}
            try:
                logger.info(f"Versuche URL {try_url} mit User-Agent: {agent[:30]}...")
                response = requests.get(try_url, headers=headers, timeout=30)
                if response.status_code == 200:
                    logger.info(f"Erfolgreich Daten von URL {try_url} abgerufen")
                    return response.text
                else:
                    logger.warning(f"Status-Code {response.status_code} für URL {try_url}")
            except requests.exceptions.RequestException as e:
                logger.warning(f"Fehler beim Zugriff auf {try_url}: {e}")
    
    # Wenn alle Versuche fehlschlagen, versuche einen lokalen Fallback
    try:
        # Prüfe, ob eine lokale Kopie der XML-Datei existiert
        local_path = os.path.join(ROOT_DIR, "app", "data", "brandenburg_data.xml")
        if os.path.exists(local_path):
            logger.info(f"Verwende lokale Fallback-Datei: {local_path}")
            with open(local_path, 'r', encoding='utf-8') as f:
                return f.read()
    except Exception as e:
        logger.warning(f"Konnte lokale Fallback-Datei nicht lesen: {e}")
    
    logger.error("Konnte keine XML-Daten abrufen. Alle Versuche fehlgeschlagen.")
    return None

def main():
    """Hauptfunktion"""
    logger.info("Starte manuellen Brandenburg-XML-Import...")
    
    try:
        # Importiere benötigte Dienste
        from app.services.structured_data_service import StructuredDataService
        from app.db.session import SessionLocal
        from app.db.models import TenantModel
        
        # Verbindung zur Datenbank herstellen
        db = SessionLocal()
        
        # Alle Tenants mit Brandenburg-Flag abrufen
        tenants = db.query(TenantModel).filter(TenantModel.is_brandenburg == True).all()
        
        if not tenants:
            logger.warning("Keine Tenants mit aktivierter Brandenburg-Integration gefunden.")
            return 1
            
        logger.info(f"{len(tenants)} Tenants mit Brandenburg-Integration gefunden.")
        
        # XML-URL der Stadt Brandenburg - aktualisierte URL
        url = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"
        
        # XML-Daten herunterladen
        xml_data = download_xml_data(url)
        if not xml_data:
            logger.error(f"Konnte keine Daten von {url} abrufen. Versuche alternative URL...")
            # Alternative URL versuchen
            alt_url = "https://www.stadt-brandenburg.de/fileadmin/chatbot/daten.xml"
            xml_data = download_xml_data(alt_url)
            if not xml_data:
                logger.error("Konnte keine Daten von der alternativen URL abrufen. Import wird abgebrochen.")
                return 1
            url = alt_url
            logger.info(f"Erfolgreich Daten von alternativer URL abgerufen: {url}")
        
        # Für jeden Tenant die Daten importieren
        for tenant in tenants:
            tenant_id = str(tenant.id)
            logger.info(f"Verarbeite Tenant: {tenant.name} (ID: {tenant_id})")
            
            # Sicherstellen, dass die Schemas für alle Datentypen existieren
            for data_type in StructuredDataService.SUPPORTED_TYPES:
                schema_success = StructuredDataService.create_schema_for_type(tenant_id, data_type)
                if schema_success:
                    logger.info(f"Schema für {data_type} erstellt oder existiert bereits")
                else:
                    logger.error(f"Konnte Schema für {data_type} nicht erstellen")
            
            # Existierende Daten löschen
            logger.info(f"Lösche existierende Daten für Tenant {tenant.name}")
            success = StructuredDataService.clear_existing_data(tenant_id)
            if not success:
                logger.warning(f"Konnte existierende Daten für Tenant {tenant_id} nicht vollständig löschen")
            
            # Daten direkt aus dem heruntergeladenen XML importieren
            logger.info(f"Importiere Brandenburg-Daten für Tenant {tenant.name}")
            from app.services.structured_data_service import structured_data_service
            
            # Wenn die direkte URL-Methode verwendet werden soll
            # result = structured_data_service.import_brandenburg_data_from_url(url, tenant_id)
            
            # Stattdessen die XML-Daten direkt übergeben
            result = structured_data_service.import_brandenburg_data_from_xml(xml_data, tenant_id)
            
            # Ergebnisse protokollieren
            total = sum(result.values())
            logger.info(f"Import abgeschlossen: {total} Einträge importiert")
            
            for type_name, count in result.items():
                logger.info(f"  - {type_name}: {count}")
        
        db.close()
        logger.info("Brandenburg-XML-Import erfolgreich abgeschlossen.")
        return 0
        
    except Exception as e:
        logger.error(f"Fehler beim Import der Brandenburg-Daten: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return 1

if __name__ == "__main__":
    sys.exit(main()) 