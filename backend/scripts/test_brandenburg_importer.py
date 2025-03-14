#!/usr/bin/env python3
"""
Script zum Testen des Brandenburg-XML-Parsers mit echten Daten.
Dieses Skript lädt die XML-Datei von der Stadt Brandenburg herunter und 
parst sie mit dem angepassten BrandenburgXMLParser.
"""

import os
import sys
import json
import requests
import tempfile
from pathlib import Path

# Root-Verzeichnis zum Python-Pfad hinzufügen
sys.path.append(str(Path(__file__).parent.parent))

from app.services.xml_parser_service import BrandenburgXMLParser

# URL der XML-Datei
BRANDENBURG_XML_URL = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"

def download_xml(url, output_path=None):
    """
    Lädt die XML-Datei von der angegebenen URL herunter.
    
    Args:
        url: URL der XML-Datei
        output_path: Pfad, an dem die XML-Datei gespeichert werden soll (optional)
        
    Returns:
        str: Pfad zur heruntergeladenen XML-Datei
    """
    print(f"Lade XML-Datei von {url} herunter...")
    
    try:
        # XML-Datei herunterladen
        response = requests.get(url, timeout=60)
        response.raise_for_status()  # Fehler bei HTTP-Fehlerstatus auslösen
        
        # Wenn kein Ausgabepfad angegeben ist, temporäre Datei erstellen
        if not output_path:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xml")
            output_path = temp_file.name
            temp_file.close()
        
        # Datei speichern
        with open(output_path, 'wb') as f:
            f.write(response.content)
        
        print(f"XML-Datei erfolgreich heruntergeladen und gespeichert unter: {output_path}")
        return output_path
    
    except Exception as e:
        print(f"Fehler beim Herunterladen der XML-Datei: {e}")
        sys.exit(1)

def parse_xml(xml_path):
    """
    Parst die XML-Datei mit dem BrandenburgXMLParser.
    
    Args:
        xml_path: Pfad zur XML-Datei
        
    Returns:
        dict: Extrahierte strukturierte Daten
    """
    print(f"Starte Parsen der XML-Datei: {xml_path}")
    
    # Parser initialisieren und Datei parsen
    parser = BrandenburgXMLParser(xml_path)
    if not parser.parse_file():
        print("Fehler beim Parsen der XML-Datei")
        sys.exit(1)
    
    # Kategorien extrahieren
    try:
        schools = parser.extract_schools()
        offices = parser.extract_offices()
        events = parser.extract_events()
        
        print(f"Erfolgreich extrahiert: {len(schools)} Schulen, {len(offices)} Ämter, {len(events)} Veranstaltungen")
        
        # Daten zurückgeben
        return {
            "schools": schools,
            "offices": offices,
            "events": events
        }
    
    except Exception as e:
        print(f"Fehler beim Extrahieren der Daten: {e}")
        sys.exit(1)

def save_results(data, output_dir="results"):
    """
    Speichert die extrahierten Daten als JSON-Dateien.
    
    Args:
        data: Extrahierte strukturierte Daten
        output_dir: Verzeichnis für die Ausgabedateien
    """
    # Ausgabeverzeichnis erstellen, falls es nicht existiert
    os.makedirs(output_dir, exist_ok=True)
    
    # Daten speichern
    for category, items in data.items():
        output_path = os.path.join(output_dir, f"brandenburg_{category}.json")
        
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
            
            print(f"{len(items)} {category} gespeichert in: {output_path}")
        
        except Exception as e:
            print(f"Fehler beim Speichern der {category}-Daten: {e}")

def print_sample_data(data):
    """
    Gibt einige Beispieldaten aus jeder Kategorie aus.
    
    Args:
        data: Extrahierte strukturierte Daten
    """
    for category, items in data.items():
        print(f"\n=== Beispiele für {category} ===")
        
        # Bis zu 3 Beispiele anzeigen
        for i, item in enumerate(items[:3]):
            print(f"\nBeispiel {i+1}:")
            
            if category == "schools":
                print(f"Name: {item['data'].get('name', 'N/A')}")
                print(f"Typ: {item['data'].get('type', 'N/A')}")
                print(f"Adresse: {item['data'].get('address', 'N/A')}")
                if "contact" in item["data"]:
                    print(f"Kontakt: {item['data']['contact'].get('phone', 'N/A')} | {item['data']['contact'].get('email', 'N/A')}")
                
            elif category == "offices":
                print(f"Name: {item['data'].get('name', 'N/A')}")
                print(f"Abteilung: {item['data'].get('department', 'N/A')}")
                print(f"Adresse: {item['data'].get('address', 'N/A')}")
                print(f"Öffnungszeiten: {item['data'].get('openingHours', 'N/A')}")
                if "services" in item["data"] and item["data"]["services"]:
                    print(f"Dienstleistungen: {', '.join(item['data']['services'][:3])}")
                
            elif category == "events":
                print(f"Titel: {item['data'].get('title', 'N/A')}")
                print(f"Datum: {item['data'].get('date', 'N/A')}")
                print(f"Zeit: {item['data'].get('time', 'N/A')}")
                print(f"Ort: {item['data'].get('location', 'N/A')}")
                print(f"Veranstalter: {item['data'].get('organizer', 'N/A')}")

def main():
    """Hauptfunktion"""
    # XML-Datei herunterladen
    xml_path = download_xml(BRANDENBURG_XML_URL)
    
    # XML-Datei parsen
    data = parse_xml(xml_path)
    
    # Beispieldaten ausgeben
    print_sample_data(data)
    
    # Ergebnisse speichern
    save_results(data)
    
    # Temporäre Datei löschen
    os.unlink(xml_path)
    print(f"\nTemporäre XML-Datei {xml_path} wurde gelöscht")
    
    print("\nVerarbeitung abgeschlossen!")

if __name__ == "__main__":
    main() 