#!/usr/bin/env python3
"""
Testskript für den Brandenburg XML-Parser mit URL-Import.
Dieses Skript testet die Extraktion von strukturierten Daten direkt aus der offiziellen Brandenburg-XML-URL.
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List

# Konfiguration der Umgebung
SCRIPT_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = SCRIPT_DIR
sys.path.append(str(ROOT_DIR))

# Importieren der benötigten Klassen aus dem Backend
from app.services.xml_parser_service import BrandenburgXMLParser

# URL der Brandenburg-XML-Datei
BRANDENBURG_XML_URL = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"


def parse_xml_from_url(url: str) -> Dict[str, List[Dict[str, Any]]]:
    """
    Parst die XML-Datei von der angegebenen URL und extrahiert strukturierte Daten.
    
    Args:
        url: URL zur XML-Datei
        
    Returns:
        Dict mit extrahierten strukturierten Daten
    """
    print(f"Starte Verarbeitung der XML-Datei von URL: {url}")
    
    parser = BrandenburgXMLParser()
    
    if not parser.parse_file(url):
        print(f"Fehler: Konnte XML-Datei nicht von URL parsen: {url}")
        return {"schools": [], "offices": [], "events": []}
    
    print("XML-Datei erfolgreich geladen. Extrahiere strukturierte Daten...")
    
    # Daten extrahieren
    schools = parser.extract_schools()
    offices = parser.extract_offices()
    events = parser.extract_events()
    
    print(f"Extrahierte {len(schools)} Schulen")
    print(f"Extrahierte {len(offices)} Ämter")
    print(f"Extrahierte {len(events)} Veranstaltungen")
    
    return {
        "schools": schools,
        "offices": offices,
        "events": events
    }


def save_results(data: Dict[str, List[Dict[str, Any]]], output_dir: str = "results") -> None:
    """
    Speichert die extrahierten Daten als JSON-Dateien.
    
    Args:
        data: Extrahierte Daten
        output_dir: Verzeichnis für die Ausgabedateien
    """
    # Ausgabeverzeichnis erstellen, falls es nicht existiert
    output_path = Path(output_dir)
    output_path.mkdir(exist_ok=True, parents=True)
    
    # Gesamtdaten speichern
    with open(output_path / "all_data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    # Einzelne Dateien für jeden Datentyp speichern
    for data_type, items in data.items():
        with open(output_path / f"{data_type}.json", "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
    
    print(f"Daten erfolgreich im Verzeichnis '{output_dir}' gespeichert.")


def print_samples(data: Dict[str, List[Dict[str, Any]]], sample_count: int = 3) -> None:
    """
    Gibt Beispiele für extrahierte Daten auf der Konsole aus.
    
    Args:
        data: Extrahierte Daten
        sample_count: Anzahl der Beispiele pro Datentyp
    """
    for data_type, items in data.items():
        print(f"\n=== {data_type.upper()} ===")
        
        if not items:
            print(f"Keine {data_type} gefunden.")
            continue
            
        for i, item in enumerate(items[:sample_count]):
            print(f"\nBeispiel {i+1}:")
            
            if data_type == "schools":
                school_data = item["data"]
                print(f"Name: {school_data.get('name', '')}")
                print(f"Typ: {school_data.get('type', '')}")
                print(f"Adresse: {school_data.get('address', '')}")
                print(f"Kontakt: {school_data.get('contact', {})}")
                
            elif data_type == "offices":
                office_data = item["data"]
                print(f"Name: {office_data.get('name', '')}")
                print(f"Abteilung: {office_data.get('department', '')}")
                print(f"Adresse: {office_data.get('address', '')}")
                print(f"Öffnungszeiten: {office_data.get('openingHours', '')}")
                print(f"Dienstleistungen: {office_data.get('services', [])}")
                
            elif data_type == "events":
                event_data = item["data"]
                print(f"Titel: {event_data.get('title', '')}")
                print(f"Datum: {event_data.get('date', '')}")
                print(f"Zeit: {event_data.get('time', '')}")
                print(f"Ort: {event_data.get('location', '')}")
                print(f"Veranstalter: {event_data.get('organizer', '')}")


def main():
    """Hauptfunktion"""
    parser = argparse.ArgumentParser(description="Brandenburg XML-Parser für URL-Import testen")
    parser.add_argument("--url", default=BRANDENBURG_XML_URL, help="URL zur Brandenburg-XML-Datei")
    parser.add_argument("--output", default="results", help="Verzeichnis für die Ausgabedateien")
    parser.add_argument("--samples", type=int, default=3, help="Anzahl der anzuzeigenden Beispiele pro Datentyp")
    
    args = parser.parse_args()
    
    # XML parsen
    data = parse_xml_from_url(args.url)
    
    # Beispiele anzeigen
    print_samples(data, args.samples)
    
    # Ergebnisse speichern
    save_results(data, args.output)
    
    print("\nVerarbeitung abgeschlossen.")


if __name__ == "__main__":
    main() 