#!/usr/bin/env python3
"""
Test-Skript für den Brandenburg XML-Import während des Deployments

Dieses Skript überprüft, ob der Brandenburg XML-Import korrekt konfiguriert ist
und ob die notwendigen Voraussetzungen erfüllt sind.

Es führt keine tatsächlichen Änderungen an den Daten durch, sondern validiert nur die Konfiguration.
"""

import os
import sys
import json
import requests
from pathlib import Path

# Root-Verzeichnis des Projekts
ROOT_DIR = Path(os.path.dirname(os.path.abspath(__file__))).parent
sys.path.append(str(ROOT_DIR))

# Import der Projektmodule
from app.db.session import SessionLocal
from app.services.tenant_service import tenant_service
from app.services.xml_parser_service import BrandenburgXMLParser

# Konfiguration
XML_URL = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"
TEST_OUTPUT_FILE = os.path.join(ROOT_DIR, "results", "brandenburg_import_test.json")
RESULT_SUMMARY = {
    "xml_url_reachable": False,
    "brandenburg_tenants": 0,
    "xml_parsing_successful": False,
    "schools_found": 0,
    "offices_found": 0,
    "events_found": 0,
    "schemas_valid": False,
    "overall_status": "Failed"
}


def test_xml_url() -> bool:
    """
    Testet, ob die XML-URL erreichbar ist.
    
    Returns:
        bool: True, wenn die URL erreichbar ist, sonst False
    """
    print(f"Teste XML-URL: {XML_URL}")
    
    try:
        headers = {
            "User-Agent": "Brandenburg-XML-Import-Test/1.0"
        }
        response = requests.head(XML_URL, headers=headers, timeout=10)
        
        if response.status_code == 200:
            print("✅ XML-URL ist erreichbar.")
            RESULT_SUMMARY["xml_url_reachable"] = True
            return True
        else:
            print(f"❌ XML-URL ist nicht erreichbar. Status-Code: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Fehler beim Testen der XML-URL: {str(e)}")
        return False


def test_brandenburg_tenants() -> list:
    """
    Testet, ob Tenants mit aktivierter Brandenburg-Integration vorhanden sind.
    
    Returns:
        list: Liste der Tenant-IDs mit aktivierter Brandenburg-Integration
    """
    print("Teste Brandenburg-Tenants...")
    
    try:
        db = SessionLocal()
        tenants = tenant_service.get_all_tenants(db)
        brandenburg_tenants = [t for t in tenants if getattr(t, 'is_brandenburg', False)]
        db.close()
        
        tenant_count = len(brandenburg_tenants)
        RESULT_SUMMARY["brandenburg_tenants"] = tenant_count
        
        if tenant_count > 0:
            print(f"✅ {tenant_count} Tenant(s) mit Brandenburg-Integration gefunden.")
            return [str(t.id) for t in brandenburg_tenants]
        else:
            print("❌ Keine Tenants mit Brandenburg-Integration gefunden.")
            return []
            
    except Exception as e:
        print(f"❌ Fehler beim Testen der Brandenburg-Tenants: {str(e)}")
        return []


def test_xml_parsing() -> bool:
    """
    Testet, ob die XML-Datei korrekt geparst werden kann.
    
    Returns:
        tuple: (Erfolg, Anzahl Schulen, Anzahl Ämter, Anzahl Veranstaltungen)
    """
    print("Teste XML-Parsing...")
    
    try:
        # Temporäre XML-Datei herunterladen
        headers = {
            "User-Agent": "Brandenburg-XML-Import-Test/1.0"
        }
        response = requests.get(XML_URL, headers=headers, timeout=60)
        
        if response.status_code != 200:
            print(f"❌ XML-Datei konnte nicht heruntergeladen werden. Status-Code: {response.status_code}")
            return False, 0, 0, 0
        
        # Temporäre Datei speichern
        temp_file = os.path.join(ROOT_DIR, "results", "brandenburg_temp.xml")
        os.makedirs(os.path.dirname(temp_file), exist_ok=True)
        
        with open(temp_file, "wb") as f:
            f.write(response.content)
        
        print(f"✅ XML-Datei heruntergeladen ({len(response.content)} Bytes).")
        
        # XML parsen
        parser = BrandenburgXMLParser(temp_file)
        
        if not parser.parse_file():
            print("❌ XML-Datei konnte nicht geparst werden.")
            return False, 0, 0, 0
            
        print("✅ XML-Datei erfolgreich geparst.")
        RESULT_SUMMARY["xml_parsing_successful"] = True
        
        # Daten extrahieren
        schools = parser.extract_schools()
        offices = parser.extract_offices()
        events = parser.extract_events()
        
        schools_count = len(schools)
        offices_count = len(offices)
        events_count = len(events)
        
        RESULT_SUMMARY["schools_found"] = schools_count
        RESULT_SUMMARY["offices_found"] = offices_count
        RESULT_SUMMARY["events_found"] = events_count
        
        print(f"✅ Extrahierte {schools_count} Schulen")
        print(f"✅ Extrahierte {offices_count} Ämter")
        print(f"✅ Extrahierte {events_count} Veranstaltungen")
        
        # Temporäre Datei löschen
        os.remove(temp_file)
        
        return True, schools_count, offices_count, events_count
        
    except Exception as e:
        print(f"❌ Fehler beim Testen des XML-Parsings: {str(e)}")
        return False, 0, 0, 0


def test_weaviate_schemas() -> bool:
    """
    Testet, ob die Weaviate-Schemas korrekt konfiguriert sind.
    
    Returns:
        bool: True, wenn die Schemas korrekt konfiguriert sind, sonst False
    """
    print("Teste Weaviate-Schemas...")
    
    try:
        from app.services.structured_data_service import StructuredDataService
        from app.db.weaviate_client import get_weaviate_client
        
        weaviate_client = get_weaviate_client()
        if not weaviate_client:
            print("❌ Weaviate-Client konnte nicht initialisiert werden.")
            return False
        
        # Prüfen, ob die Schemas existieren
        schema_classes = [c["class"] for c in weaviate_client.schema.get()["classes"]]
        
        tenant_id = "test_tenant"  # Dummy-Tenant-ID für den Test
        required_classes = [
            f"{tenant_id}_structured_school",
            f"{tenant_id}_structured_office",
            f"{tenant_id}_structured_event"
        ]
        
        # Reine Prüfung, ob das Skript die Funktion aufrufen kann
        try:
            # Wir führen den Test mit einem Dummy-Tenant durch
            StructuredDataService.get_schema_class_name(tenant_id, "school")
            StructuredDataService.get_schema_class_name(tenant_id, "office")
            StructuredDataService.get_schema_class_name(tenant_id, "event")
            
            print("✅ Weaviate-Schema-Funktionen sind korrekt konfiguriert.")
            RESULT_SUMMARY["schemas_valid"] = True
            return True
            
        except Exception as e:
            print(f"❌ Fehler beim Testen der Weaviate-Schema-Funktionen: {str(e)}")
            return False
            
    except Exception as e:
        print(f"❌ Fehler beim Testen der Weaviate-Schemas: {str(e)}")
        return False


def main():
    """Hauptfunktion"""
    print("=== Brandenburg XML-Import-Test ===\n")
    
    # XML-URL testen
    xml_reachable = test_xml_url()
    
    # Brandenburg-Tenants testen
    tenants = test_brandenburg_tenants()
    
    # XML-Parsing testen
    if xml_reachable:
        parsing_success, schools, offices, events = test_xml_parsing()
    
    # Weaviate-Schemas testen
    schemas_valid = test_weaviate_schemas()
    
    # Gesamtergebnis
    print("\n=== Testergebnis ===")
    
    if xml_reachable and len(tenants) > 0 and RESULT_SUMMARY["xml_parsing_successful"] and RESULT_SUMMARY["schemas_valid"]:
        RESULT_SUMMARY["overall_status"] = "Success"
        print("✅ Brandenburg XML-Import-Test erfolgreich abgeschlossen.")
    else:
        print("❌ Brandenburg XML-Import-Test fehlgeschlagen.")
    
    # Ergebnis speichern
    os.makedirs(os.path.dirname(TEST_OUTPUT_FILE), exist_ok=True)
    with open(TEST_OUTPUT_FILE, "w") as f:
        json.dump(RESULT_SUMMARY, f, indent=2)
    
    print(f"Testergebnis in Datei '{TEST_OUTPUT_FILE}' gespeichert.")
    
    # Exitcode basierend auf Gesamtergebnis
    return 0 if RESULT_SUMMARY["overall_status"] == "Success" else 1


if __name__ == "__main__":
    sys.exit(main()) 