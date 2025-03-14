#!/usr/bin/env python3
"""
Vereinfachtes Skript zum Testen des Brandenburg-XML-Parsers.
Dieses Skript verwendet eine lokale XML-Testdatei und 
parst sie mit einem XML-Parser, der ohne App-Abhängigkeiten funktioniert.
"""

import os
import sys
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Any, Optional, Union

# Pfad zur lokalen Test-XML-Datei
XML_TEST_FILE = "backend/test_brandenburg.xml"

class BrandenburgXMLParser:
    """
    Parser für die Brandenburg-XML-Datei.
    """
    def __init__(self, xml_path: str):
        """
        Initialisiert den Parser mit dem Pfad zur XML-Datei.
        
        Args:
            xml_path: Pfad zur XML-Datei
        """
        self.xml_path = xml_path
        self.tree = None
        self.root = None
    
    def parse_file(self) -> bool:
        """
        Parst die XML-Datei.
        
        Returns:
            bool: True, wenn das Parsen erfolgreich war, sonst False
        """
        try:
            self.tree = ET.parse(self.xml_path)
            self.root = self.tree.getroot()
            return True
        except Exception as e:
            print(f"Fehler beim Parsen der XML-Datei: {e}")
            return False
    
    def extract_schools(self) -> List[Dict[str, Any]]:
        """
        Extrahiert alle Schulen aus der XML-Datei.
        
        Returns:
            List[Dict]: Liste mit strukturierten Daten für Schulen
        """
        schools = []
        
        # Alle Schul-Elemente finden
        school_elements = self.root.findall(".//schule")
        
        for school in school_elements:
            name = self._get_element_text(school, "bezeichnung")
            type_elem = self._get_element_text(school, "schulart")
            adresse = self._get_element_text(school, "strasse_nr")
            plz = self._get_element_text(school, "plz")
            ort = self._get_element_text(school, "ort")
            
            phone = self._get_element_text(school, "telefon")
            email = self._get_element_text(school, "email")
            website = self._get_element_text(school, "internet")
            
            full_address = f"{adresse}, {plz} {ort}" if adresse and plz and ort else "Keine Adresse angegeben"
            
            # Kontaktdaten strukturieren
            contact = {
                "phone": phone if phone else "Nicht angegeben",
                "email": email if email else "Nicht angegeben",
                "website": website if website else "Nicht angegeben"
            }
            
            # Daten strukturieren
            school_data = {
                "name": name if name else "Unbekannte Schule",
                "type": type_elem if type_elem else "Unbekannter Schultyp",
                "address": full_address,
                "contact": contact
            }
            
            # Daten zur Liste hinzufügen
            schools.append({
                "data": school_data,
                "type": "school"
            })
        
        return schools
    
    def extract_offices(self) -> List[Dict[str, Any]]:
        """
        Extrahiert alle Ämter aus der XML-Datei.
        
        Returns:
            List[Dict]: Liste mit strukturierten Daten für Ämter
        """
        offices = []
        
        # Alle Amts-Elemente finden
        office_elements = self.root.findall(".//amt")
        
        for office in office_elements:
            name = self._get_element_text(office, "bezeichnung")
            department = self._get_element_text(office, "fachbereich")
            address_elem = office.find("adresse")
            
            address = ""
            if address_elem is not None:
                street = self._get_element_text(address_elem, "strasse_nr")
                postal = self._get_element_text(address_elem, "plz")
                city = self._get_element_text(address_elem, "ort")
                address = f"{street}, {postal} {city}" if street and postal and city else "Keine Adresse angegeben"
            
            # Öffnungszeiten extrahieren
            opening_hours = []
            hours_elem = office.find("oeffnungszeiten")
            if hours_elem is not None:
                day_elements = hours_elem.findall("tag")
                for day_elem in day_elements:
                    day_name = self._get_element_text(day_elem, "bezeichnung")
                    time_elements = day_elem.findall("zeit")
                    for time_elem in time_elements:
                        start_time = self._get_element_text(time_elem, "von")
                        end_time = self._get_element_text(time_elem, "bis")
                        if day_name and start_time and end_time:
                            opening_hours.append(f"{day_name}: {start_time} - {end_time} Uhr")
            
            # Dienstleistungen extrahieren
            services = []
            services_elem = office.find("dienstleistungen")
            if services_elem is not None:
                service_elements = services_elem.findall("dienstleistung")
                for service_elem in service_elements:
                    service_name = self._get_element_text(service_elem, "bezeichnung")
                    if service_name:
                        services.append(service_name)
            
            # Daten strukturieren
            office_data = {
                "name": name if name else "Unbekanntes Amt",
                "department": department if department else "Keine Abteilung angegeben",
                "address": address,
                "openingHours": ", ".join(opening_hours) if opening_hours else "Keine Öffnungszeiten angegeben",
                "services": services
            }
            
            # Daten zur Liste hinzufügen
            offices.append({
                "data": office_data,
                "type": "office"
            })
        
        return offices
    
    def extract_events(self) -> List[Dict[str, Any]]:
        """
        Extrahiert alle Veranstaltungen aus der XML-Datei.
        
        Returns:
            List[Dict]: Liste mit strukturierten Daten für Veranstaltungen
        """
        events = []
        
        # Alle Veranstaltungs-Elemente finden
        event_elements = self.root.findall(".//veranstaltung")
        
        for event in event_elements:
            title = self._get_element_text(event, "bezeichnung")
            date = self._get_element_text(event, "datum")
            time = self._get_element_text(event, "uhrzeit")
            location = self._get_element_text(event, "ort")
            organizer = self._get_element_text(event, "veranstalter")
            description = self._get_element_text(event, "beschreibung")
            
            # Daten strukturieren
            event_data = {
                "title": title if title else "Unbekannte Veranstaltung",
                "date": date if date else "Kein Datum angegeben",
                "time": time if time else "Keine Uhrzeit angegeben",
                "location": location if location else "Kein Ort angegeben",
                "organizer": organizer if organizer else "Kein Veranstalter angegeben",
                "description": description if description else "Keine Beschreibung verfügbar"
            }
            
            # Daten zur Liste hinzufügen
            events.append({
                "data": event_data,
                "type": "event"
            })
        
        return events
    
    def _get_element_text(self, element: ET.Element, tag_name: str) -> Optional[str]:
        """
        Hilfsmethode, um den Text eines Elements zu extrahieren.
        
        Args:
            element: Parent-Element
            tag_name: Name des gesuchten Tags
            
        Returns:
            Optional[str]: Text des Elements oder None, wenn das Element nicht existiert
        """
        elem = element.find(tag_name)
        if elem is not None and elem.text:
            return elem.text.strip()
        return None

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
    # XML-Testdatei verwenden
    xml_path = XML_TEST_FILE
    
    # Prüfen, ob die Datei existiert
    if not os.path.exists(xml_path):
        print(f"Fehler: Die XML-Testdatei {xml_path} wurde nicht gefunden.")
        sys.exit(1)
    
    print(f"Verwende lokale XML-Testdatei: {xml_path}")
    
    # XML-Datei parsen
    data = parse_xml(xml_path)
    
    # Beispieldaten ausgeben
    print_sample_data(data)
    
    # Ergebnisse speichern
    save_results(data)
    
    print("\nVerarbeitung abgeschlossen!")

if __name__ == "__main__":
    main() 