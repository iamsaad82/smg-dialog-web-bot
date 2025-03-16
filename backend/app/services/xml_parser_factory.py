import os
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Union, Optional
import logging
from pathlib import Path
import json
import re
from datetime import datetime
from .xml_parser_service import XMLParserBase

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class XMLParserFactory:
    """Factory-Klasse zum Erstellen des richtigen XML-Parsers basierend auf dem XML-Typ."""
    
    @staticmethod
    def create_parser(xml_type: str = "generic"):
        """
        Erstellt einen XML-Parser basierend auf dem angegebenen XML-Typ.
        
        Args:
            xml_type: Typ der XML-Daten (generic, brandenburg, etc.)
            
        Returns:
            XMLParser: Eine Instanz des entsprechenden XML-Parsers
        """
        if xml_type == "brandenburg":
            return BrandenburgXMLParser()
        # Hier können weitere spezifische Parser hinzugefügt werden
        # elif xml_type == "andererclient":
        #    return AndererClientXMLParser()
        else:
            return GenericXMLParser()


class GenericXMLParser(XMLParserBase):
    """Generischer XML-Parser für beliebige XML-Strukturen."""
    
    def parse(self, xml_file_path: str) -> dict:
        """
        Parst eine XML-Datei und gibt strukturierte Daten zurück.
        
        Args:
            xml_file_path: Pfad zur XML-Datei
            
        Returns:
            dict: Strukturierte Daten aus der XML-Datei
        """
        import xml.etree.ElementTree as ET
        
        # Ergebnis-Dictionary initialisieren
        result = {
            "schools": [],
            "offices": [],
            "events": [],
            "services": [],
            "local_laws": [],
            "kindergartens": [],
            "webpages": [],
            "waste_managements": []
        }
        
        try:
            # XML-Datei parsen
            tree = ET.parse(xml_file_path)
            root = tree.getroot()
            
            # Generischer Parser, der versucht, die Struktur automatisch zu erkennen
            # Durchsucht die XML-Datei nach definierten Kategorien
            
            # Beispiel: Suche nach Schulen, Ämtern, Veranstaltungen etc.
            for category in ["Schulen", "Schools", "school", "Schule"]:
                elements = root.findall(f".//{category}")
                elements.extend(root.findall(f".//*[@type='{category}']"))
                
                for elem in elements:
                    school = self._extract_entity_data(elem)
                    if school:
                        result["schools"].append(school)
            
            # Ähnlich für andere Kategorien...
            for category in ["Ämter", "Offices", "office", "Amt"]:
                elements = root.findall(f".//{category}")
                elements.extend(root.findall(f".//*[@type='{category}']"))
                
                for elem in elements:
                    office = self._extract_entity_data(elem)
                    if office:
                        result["offices"].append(office)
            
            # Veranstaltungen
            for category in ["Veranstaltungen", "Events", "event", "Veranstaltung"]:
                elements = root.findall(f".//{category}")
                elements.extend(root.findall(f".//*[@type='{category}']"))
                
                for elem in elements:
                    event = self._extract_entity_data(elem)
                    if event:
                        result["events"].append(event)
            
            # Weitere generische Kategorien können hier hinzugefügt werden...
            
            return result
            
        except Exception as e:
            print(f"Fehler beim Parsen der XML-Datei: {str(e)}")
            raise
    
    def _extract_entity_data(self, element) -> dict:
        """
        Extrahiert Daten aus einem XML-Element.
        
        Args:
            element: XML-Element
            
        Returns:
            dict: Extrahierte Daten
        """
        data = {}
        
        # Versuche, alle Attribute und Unterelemente zu extrahieren
        # Attribute
        for attr, value in element.attrib.items():
            data[attr] = value
        
        # Unterelemente
        for child in element:
            # Wenn das Kind selbst Kinder hat, rekursiv extrahieren
            if len(list(child)) > 0:
                data[child.tag] = self._extract_entity_data(child)
            else:
                # Sonst Text oder Attribute extrahieren
                if child.text and child.text.strip():
                    data[child.tag] = child.text.strip()
                
                # Attribute des Kindes
                for attr, value in child.attrib.items():
                    data[f"{child.tag}_{attr}"] = value
        
        return data

class BrandenburgXMLParser(XMLParserBase):
    """
    Spezialisierter XML-Parser für Brandenburg-XML-Daten.
    Extrahiert Schulen, Ämter und Veranstaltungen aus der Brandenburg-XML-Struktur.
    """
    
    def parse(self, xml_file_path: str) -> dict:
        """
        Parst eine Brandenburg-XML-Datei und gibt strukturierte Daten zurück.
        
        Args:
            xml_file_path: Pfad zur XML-Datei
            
        Returns:
            dict: Strukturierte Daten aus der XML-Datei
        """
        import xml.etree.ElementTree as ET
        import re
        
        # Ergebnis-Dictionary initialisieren
        result = {
            "schools": [],
            "offices": [],
            "events": []
        }
        
        try:
            # XML-Datei parsen
            tree = ET.parse(xml_file_path)
            root = tree.getroot()
            
            # Schulen extrahieren
            schools_section = root.find(".//Schulen")
            if schools_section is not None:
                for school in schools_section.findall("./Schule"):
                    school_data = self._extract_school_data(school)
                    if school_data:
                        result["schools"].append(school_data)
            
            # Ämter extrahieren
            offices_section = root.find(".//Aemter")
            if offices_section is not None:
                for office in offices_section.findall("./Amt"):
                    office_data = self._extract_office_data(office)
                    if office_data:
                        result["offices"].append(office_data)
            
            # Veranstaltungen extrahieren
            events_section = root.find(".//Veranstaltungen")
            if events_section is not None:
                for event in events_section.findall("./Veranstaltung"):
                    event_data = self._extract_event_data(event)
                    if event_data:
                        result["events"].append(event_data)
            
            return result
            
        except Exception as e:
            print(f"Fehler beim Parsen der Brandenburg-XML-Datei: {str(e)}")
            raise
    
    def _extract_text(self, element, xpath: str, default: str = "") -> str:
        """Extrahiert Text aus einem Element mit gegebenem XPath."""
        try:
            el = element.find(xpath)
            return el.text.strip() if el is not None and el.text else default
        except Exception:
            return default
    
    def _extract_school_data(self, school_element) -> dict:
        """Extrahiert Daten einer Schule aus dem XML-Element."""
        school_data = {
            "name": self._extract_text(school_element, "./Name"),
            "address": {
                "street": self._extract_text(school_element, "./Adresse/Strasse"),
                "zip": self._extract_text(school_element, "./Adresse/PLZ"),
                "city": self._extract_text(school_element, "./Adresse/Ort")
            },
            "contact": {
                "phone": self._extract_text(school_element, "./Telefon"),
                "email": self._extract_text(school_element, "./Email"),
                "website": self._extract_text(school_element, "./Website")
            },
            "type": self._extract_text(school_element, "./Schulform"),
            "description": self._extract_text(school_element, "./Beschreibung")
        }
        
        # Koordinaten extrahieren, falls vorhanden
        lat = self._extract_text(school_element, "./Koordinaten/Latitude")
        lon = self._extract_text(school_element, "./Koordinaten/Longitude")
        if lat and lon:
            school_data["coordinates"] = {
                "latitude": lat,
                "longitude": lon
            }
        
        return school_data
    
    def _extract_office_data(self, office_element) -> dict:
        """Extrahiert Daten eines Amtes aus dem XML-Element."""
        office_data = {
            "name": self._extract_text(office_element, "./Name"),
            "address": {
                "street": self._extract_text(office_element, "./Adresse/Strasse"),
                "zip": self._extract_text(office_element, "./Adresse/PLZ"),
                "city": self._extract_text(office_element, "./Adresse/Ort")
            },
            "contact": {
                "phone": self._extract_text(office_element, "./Telefon"),
                "email": self._extract_text(office_element, "./Email"),
                "website": self._extract_text(office_element, "./Website")
            },
            "opening_hours": self._extract_text(office_element, "./Oeffnungszeiten"),
            "services": self._extract_text(office_element, "./Dienstleistungen"),
            "description": self._extract_text(office_element, "./Beschreibung")
        }
        
        # Koordinaten extrahieren, falls vorhanden
        lat = self._extract_text(office_element, "./Koordinaten/Latitude")
        lon = self._extract_text(office_element, "./Koordinaten/Longitude")
        if lat and lon:
            office_data["coordinates"] = {
                "latitude": lat,
                "longitude": lon
            }
        
        return office_data
    
    def _extract_event_data(self, event_element) -> dict:
        """Extrahiert Daten einer Veranstaltung aus dem XML-Element."""
        event_data = {
            "title": self._extract_text(event_element, "./Titel"),
            "date": self._extract_text(event_element, "./Datum"),
            "time": self._extract_text(event_element, "./Zeit"),
            "location": {
                "name": self._extract_text(event_element, "./Ort/Name"),
                "address": {
                    "street": self._extract_text(event_element, "./Ort/Adresse/Strasse"),
                    "zip": self._extract_text(event_element, "./Ort/Adresse/PLZ"),
                    "city": self._extract_text(event_element, "./Ort/Adresse/Ort")
                }
            },
            "description": self._extract_text(event_element, "./Beschreibung"),
            "organizer": self._extract_text(event_element, "./Veranstalter"),
            "category": self._extract_text(event_element, "./Kategorie"),
            "url": self._extract_text(event_element, "./URL")
        }
        
        # Koordinaten extrahieren, falls vorhanden
        lat = self._extract_text(event_element, "./Koordinaten/Latitude")
        lon = self._extract_text(event_element, "./Koordinaten/Longitude")
        if lat and lon:
            event_data["coordinates"] = {
                "latitude": lat,
                "longitude": lon
            }
        
        return event_data


# Beispiel für die Verwendung
if __name__ == "__main__":
    parser = BrandenburgXMLParser()
    if parser.parse_file("path/to/brandenburg_data.xml"):
        schools = parser.extract_schools()
        offices = parser.extract_offices()
        events = parser.extract_events()
        
        # Optional: Als JSON speichern
        parser.save_as_json("path/to/output.json") 