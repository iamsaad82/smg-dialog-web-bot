import os
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Union, Optional
import logging
from pathlib import Path
import json

# Logger konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BrandenburgXMLParser:
    """
    Parser für XML-Dateien aus Brandenburg an der Havel.
    Wandelt XML-Daten in strukturierte Daten-Objekte für die Speicherung in Weaviate um.
    """
    
    def __init__(self, xml_file_path: str = None):
        """
        Initialisiert den XML-Parser.
        
        Args:
            xml_file_path: Pfad zur XML-Datei (optional, kann auch später mit parse_file gesetzt werden)
        """
        self.xml_file_path = xml_file_path
        self.tree = None
        self.root = None
    
    def parse_file(self, xml_file_path: str = None) -> bool:
        """
        Parst eine XML-Datei.
        
        Args:
            xml_file_path: Pfad zur XML-Datei (falls nicht schon im Konstruktor angegeben)
            
        Returns:
            bool: True, wenn das Parsen erfolgreich war, sonst False
        """
        if xml_file_path:
            self.xml_file_path = xml_file_path
        
        if not self.xml_file_path:
            logger.error("Kein XML-Dateipfad angegeben")
            return False
        
        if not os.path.exists(self.xml_file_path):
            logger.error(f"XML-Datei nicht gefunden: {self.xml_file_path}")
            return False
        
        try:
            self.tree = ET.parse(self.xml_file_path)
            self.root = self.tree.getroot()
            logger.info(f"XML-Datei erfolgreich geladen: {self.xml_file_path}")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Parsen der XML-Datei: {str(e)}")
            return False
    
    def extract_schools(self) -> List[Dict[str, Any]]:
        """
        Extrahiert Schulinformationen aus der XML-Datei.
        
        Returns:
            List[Dict[str, Any]]: Liste von Schuldaten im strukturierten Format
        """
        if not self.root:
            logger.error("XML-Datei nicht geladen")
            return []
        
        schools = []
        
        # XPath-Ausdruck anpassen, je nach tatsächlicher XML-Struktur
        # Dies ist ein Platzhalter und muss an die tatsächliche XML-Struktur angepasst werden
        school_elements = self.root.findall(".//school") or self.root.findall(".//Schule")
        
        for school_elem in school_elements:
            try:
                school_data = {
                    "type": "school",
                    "data": {
                        "name": self._get_element_text(school_elem, "./name") or self._get_element_text(school_elem, "./Name"),
                        "type": self._get_element_text(school_elem, "./type") or self._get_element_text(school_elem, "./Typ"),
                        "schoolId": self._get_element_text(school_elem, "./id") or self._get_element_text(school_elem, "./ID"),
                        "address": self._get_element_text(school_elem, "./address") or self._get_element_text(school_elem, "./Adresse"),
                        "management": self._get_element_text(school_elem, "./management") or self._get_element_text(school_elem, "./Schulleitung"),
                        "contact": {
                            "phone": self._get_element_text(school_elem, "./contact/phone") or self._get_element_text(school_elem, "./Kontakt/Telefon"),
                            "email": self._get_element_text(school_elem, "./contact/email") or self._get_element_text(school_elem, "./Kontakt/Email"),
                            "website": self._get_element_text(school_elem, "./contact/website") or self._get_element_text(school_elem, "./Kontakt/Website")
                        },
                        "details": {
                            "allDayCare": self._get_element_boolean(school_elem, "./details/allDayCare") or self._get_element_boolean(school_elem, "./Details/Ganztagsschule"),
                            "additionalInfo": self._get_element_text(school_elem, "./details/additionalInfo") or self._get_element_text(school_elem, "./Details/ZusatzInfo")
                        }
                    }
                }
                
                # Null-Werte entfernen
                school_data = self._clean_empty_values(school_data)
                schools.append(school_data)
                
            except Exception as e:
                logger.error(f"Fehler beim Extrahieren der Schuldaten: {str(e)}")
        
        logger.info(f"{len(schools)} Schulen extrahiert")
        return schools
    
    def extract_offices(self) -> List[Dict[str, Any]]:
        """
        Extrahiert Amtsinformationen aus der XML-Datei.
        
        Returns:
            List[Dict[str, Any]]: Liste von Amtsdaten im strukturierten Format
        """
        if not self.root:
            logger.error("XML-Datei nicht geladen")
            return []
        
        offices = []
        
        # XPath-Ausdruck anpassen, je nach tatsächlicher XML-Struktur
        office_elements = self.root.findall(".//office") or self.root.findall(".//Amt")
        
        for office_elem in office_elements:
            try:
                office_data = {
                    "type": "office",
                    "data": {
                        "name": self._get_element_text(office_elem, "./name") or self._get_element_text(office_elem, "./Name"),
                        "department": self._get_element_text(office_elem, "./department") or self._get_element_text(office_elem, "./Abteilung"),
                        "address": self._get_element_text(office_elem, "./address") or self._get_element_text(office_elem, "./Adresse"),
                        "openingHours": self._get_element_text(office_elem, "./openingHours") or self._get_element_text(office_elem, "./Oeffnungszeiten"),
                        "contact": {
                            "phone": self._get_element_text(office_elem, "./contact/phone") or self._get_element_text(office_elem, "./Kontakt/Telefon"),
                            "email": self._get_element_text(office_elem, "./contact/email") or self._get_element_text(office_elem, "./Kontakt/Email"),
                            "website": self._get_element_text(office_elem, "./contact/website") or self._get_element_text(office_elem, "./Kontakt/Website")
                        },
                        "services": self._get_services(office_elem) or self._get_services(office_elem, "./Leistungen/Leistung")
                    }
                }
                
                # Null-Werte entfernen
                office_data = self._clean_empty_values(office_data)
                offices.append(office_data)
                
            except Exception as e:
                logger.error(f"Fehler beim Extrahieren der Amtsdaten: {str(e)}")
        
        logger.info(f"{len(offices)} Ämter extrahiert")
        return offices
    
    def extract_events(self) -> List[Dict[str, Any]]:
        """
        Extrahiert Veranstaltungsinformationen aus der XML-Datei.
        
        Returns:
            List[Dict[str, Any]]: Liste von Veranstaltungsdaten im strukturierten Format
        """
        if not self.root:
            logger.error("XML-Datei nicht geladen")
            return []
        
        events = []
        
        # XPath-Ausdruck anpassen, je nach tatsächlicher XML-Struktur
        event_elements = self.root.findall(".//event") or self.root.findall(".//Veranstaltung")
        
        for event_elem in event_elements:
            try:
                event_data = {
                    "type": "event",
                    "data": {
                        "title": self._get_element_text(event_elem, "./title") or self._get_element_text(event_elem, "./Titel"),
                        "date": self._get_element_text(event_elem, "./date") or self._get_element_text(event_elem, "./Datum"),
                        "time": self._get_element_text(event_elem, "./time") or self._get_element_text(event_elem, "./Zeit"),
                        "location": self._get_element_text(event_elem, "./location") or self._get_element_text(event_elem, "./Ort"),
                        "description": self._get_element_text(event_elem, "./description") or self._get_element_text(event_elem, "./Beschreibung"),
                        "organizer": self._get_element_text(event_elem, "./organizer") or self._get_element_text(event_elem, "./Veranstalter"),
                        "contact": {
                            "phone": self._get_element_text(event_elem, "./contact/phone") or self._get_element_text(event_elem, "./Kontakt/Telefon"),
                            "email": self._get_element_text(event_elem, "./contact/email") or self._get_element_text(event_elem, "./Kontakt/Email"),
                            "website": self._get_element_text(event_elem, "./contact/website") or self._get_element_text(event_elem, "./Kontakt/Website")
                        }
                    }
                }
                
                # Null-Werte entfernen
                event_data = self._clean_empty_values(event_data)
                events.append(event_data)
                
            except Exception as e:
                logger.error(f"Fehler beim Extrahieren der Veranstaltungsdaten: {str(e)}")
        
        logger.info(f"{len(events)} Veranstaltungen extrahiert")
        return events
    
    def extract_all_data(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Extrahiert alle Daten aus der XML-Datei.
        
        Returns:
            Dict[str, List[Dict[str, Any]]]: Dictionary mit allen strukturierten Daten
        """
        return {
            "schools": self.extract_schools(),
            "offices": self.extract_offices(),
            "events": self.extract_events()
        }
    
    def save_as_json(self, output_file: str) -> bool:
        """
        Speichert die extrahierten Daten als JSON-Datei.
        
        Args:
            output_file: Pfad zur Ausgabe-JSON-Datei
            
        Returns:
            bool: True, wenn das Speichern erfolgreich war, sonst False
        """
        try:
            data = self.extract_all_data()
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            logger.info(f"Daten erfolgreich als JSON gespeichert: {output_file}")
            return True
        except Exception as e:
            logger.error(f"Fehler beim Speichern der Daten als JSON: {str(e)}")
            return False
    
    # --- Hilfsmethoden ---
    
    def _get_element_text(self, parent_elem, xpath: str) -> Optional[str]:
        """Extrahiert den Text eines Elements basierend auf einem XPath-Ausdruck"""
        try:
            element = parent_elem.find(xpath)
            return element.text.strip() if element is not None and element.text else None
        except Exception:
            return None
    
    def _get_element_boolean(self, parent_elem, xpath: str) -> Optional[bool]:
        """Extrahiert einen booleschen Wert aus einem Element basierend auf einem XPath-Ausdruck"""
        try:
            element = parent_elem.find(xpath)
            if element is None or element.text is None:
                return None
            
            text = element.text.strip().lower()
            return text in ['true', 'ja', 'yes', '1', 'wahr']
        except Exception:
            return None
    
    def _get_services(self, parent_elem, xpath: str = "./services/service") -> Optional[List[str]]:
        """Extrahiert eine Liste von Services aus einem Element"""
        try:
            elements = parent_elem.findall(xpath)
            if not elements:
                return None
            
            return [elem.text.strip() for elem in elements if elem.text]
        except Exception:
            return None
    
    def _clean_empty_values(self, data: Dict) -> Dict:
        """Entfernt None-Werte und leere Dictionaries aus den Daten"""
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if isinstance(value, dict):
                    cleaned = self._clean_empty_values(value)
                    if cleaned:  # Nur nicht-leere Dictionaries behalten
                        result[key] = cleaned
                elif value is not None:  # None-Werte ausfiltern
                    result[key] = value
            return result
        return data


# Beispiel für die Verwendung
if __name__ == "__main__":
    parser = BrandenburgXMLParser()
    if parser.parse_file("path/to/brandenburg_data.xml"):
        schools = parser.extract_schools()
        offices = parser.extract_offices()
        events = parser.extract_events()
        
        # Optional: Als JSON speichern
        parser.save_as_json("path/to/output.json") 