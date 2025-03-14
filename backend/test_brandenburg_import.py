#!/usr/bin/env python3
"""
Skript zum direkten Import der Brandenburg XML-Daten in die Weaviate-Datenbank.
Dieses Skript umgeht die API und importiert die Daten direkt.
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
from app.services.structured_data_service import StructuredDataService
from app.db.session import SessionLocal

# Pfad zur heruntergeladenen XML-Datei
DEFAULT_XML_PATH = "/app/downloaded_brandenburg.xml"
# ID des Brandenburg-Tenants
BRANDENBURG_TENANT_ID = "9d8d5dcf-f6b3-4d06-8016-0f24869f8872"


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
    
    # Einzelne Dateien für jeden Datentyp speichern
    for data_type, items in data.items():
        filename = f"brandenburg_{data_type}.json"
        filepath = output_path / filename
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"Datei gespeichert: {filepath}")
    
    print(f"Daten erfolgreich im Verzeichnis '{output_dir}' gespeichert.")


def import_brandenburg_data(xml_file_path: str, tenant_id: str) -> Dict[str, int]:
    """
    Importiert Brandenburg-Daten aus einer XML-Datei und speichert sie in Weaviate.
    
    Args:
        xml_file_path: Pfad zur XML-Datei
        tenant_id: ID des Tenants
        
    Returns:
        Dict mit Anzahl der importierten Elemente pro Typ
    """
    print(f"Starte Verarbeitung der XML-Datei: {xml_file_path}")
    
    parser = BrandenburgXMLParser(xml_file_path)
    
    if not parser.parse_file():
        print(f"Fehler: Konnte XML-Datei nicht parsen: {xml_file_path}")
        return {"schools": 0, "offices": 0, "events": 0}
    
    print("XML-Datei erfolgreich geladen. Extrahiere strukturierte Daten...")
    
    # Daten extrahieren
    schools = parser.extract_schools()
    offices = parser.extract_offices()
    events = parser.extract_events()
    
    print(f"Extrahierte {len(schools)} Schulen")
    print(f"Extrahierte {len(offices)} Ämter")
    print(f"Extrahierte {len(events)} Veranstaltungen")
    
    # Daten als JSON speichern
    data = {
        "schools": schools,
        "offices": offices,
        "events": events
    }
    save_results(data)
    
    print("Daten wurden erfolgreich extrahiert und als JSON gespeichert.")
    print("Um die Daten in Weaviate zu importieren, verwenden Sie bitte die Admin-Oberfläche oder den API-Endpunkt mit Admin-Rechten.")
    
    return {
        "schools": len(schools),
        "offices": len(offices),
        "events": len(events)
    }


def main():
    """Hauptfunktion"""
    parser = argparse.ArgumentParser(description="Brandenburg XML-Daten extrahieren und als JSON speichern")
    parser.add_argument("--file", default=DEFAULT_XML_PATH, help="Pfad zur Brandenburg-XML-Datei")
    parser.add_argument("--tenant", default=BRANDENBURG_TENANT_ID, help="ID des Brandenburg-Tenants")
    
    args = parser.parse_args()
    
    # XML parsen und Daten extrahieren
    result = import_brandenburg_data(args.file, args.tenant)
    
    print("\nVerarbeitung abgeschlossen.")
    print(f"Extrahierte Schulen: {result['schools']}")
    print(f"Extrahierte Ämter: {result['offices']}")
    print(f"Extrahierte Veranstaltungen: {result['events']}")
    print("\nDie Daten wurden als JSON-Dateien im 'results'-Verzeichnis gespeichert.")
    print("Um die Daten in Weaviate zu importieren, verwenden Sie bitte die Admin-Oberfläche oder den API-Endpunkt mit Admin-Rechten.")


if __name__ == "__main__":
    main() 