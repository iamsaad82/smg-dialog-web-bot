import os
import xml.etree.ElementTree as ET
from typing import Dict, List, Any, Union, Optional
import logging
from pathlib import Path
import json
import re

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
        
        # Schlüsselwörter für die Kategorisierung
        self.keywords = {
            "school": [
                "schule", "grundschule", "gesamtschule", "gymnasium", "oberschule", 
                "schulen", "bildung", "unterricht", "lehrer", "schüler", 
                "schuljahr", "schulanmeldung", "schuleingang", "schulleiter"
            ],
            "office": [
                "amt", "ämter", "behörde", "verwaltung", "bürgeramt", "bürgerbüro", 
                "rathaus", "bürgerservice", "servicepoint", "dienstleistungen", 
                "sprechzeiten", "öffnungszeiten", "beratung", "bürgerdienst",
                "stadtbibliothek", "standesamt", "ordnungsamt", "bauamt"
            ],
            "event": [
                "veranstaltung", "event", "termin", "termine", "veranstaltungen", 
                "events", "konzert", "festival", "ausstellung", "messe", "feier", 
                "jubiläum", "eröffnung", "stadtfest", "markt", "weihnachtsmarkt"
            ]
        }
    
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
        
        # Prüfen, ob es sich um eine URL handelt
        if self.xml_file_path.startswith(('http://', 'https://')):
            return self._parse_from_url(self.xml_file_path)
        
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
            
    def _parse_from_url(self, url: str) -> bool:
        """
        Parst eine XML-Datei von einer URL.
        
        Args:
            url: URL der XML-Datei
            
        Returns:
            bool: True, wenn das Parsen erfolgreich war, sonst False
        """
        try:
            import requests
            
            logger.info(f"Lade XML-Daten von URL: {url}")
            response = requests.get(url, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"Fehler beim Laden der XML-Datei von URL: {url} (Status-Code: {response.status_code})")
                return False
            
            xml_content = response.content
            
            try:
                self.root = ET.fromstring(xml_content)
                self.tree = ET.ElementTree(self.root)
                logger.info(f"XML-Daten erfolgreich von URL geladen: {url}")
                return True
            except Exception as e:
                logger.error(f"Fehler beim Parsen der XML-Daten von URL: {str(e)}")
                return False
                
        except ImportError:
            logger.error("Das 'requests' Paket ist nicht installiert. Führen Sie 'pip install requests' aus.")
            return False
        except Exception as e:
            logger.error(f"Fehler beim Laden der XML-Datei von URL: {str(e)}")
            return False
    
    def _categorize_message(self, title: str, description: str, content: str) -> str:
        """
        Kategorisiert eine Nachricht basierend auf ihrem Inhalt.
        
        Args:
            title: Titel der Nachricht
            description: Beschreibung der Nachricht
            content: Hauptinhalt der Nachricht
            
        Returns:
            str: Kategorie ('school', 'office', 'event' oder 'other')
        """
        # Text für die Analyse vorbereiten (alles in Kleinbuchstaben)
        analysis_text = f"{title} {description} {content}".lower()
        
        # Zählen der Schlüsselwörter für jede Kategorie
        category_scores = {category: 0 for category in self.keywords.keys()}
        
        for category, words in self.keywords.items():
            for word in words:
                # Zähle wie oft das Wort im Text vorkommt (als ganzes Wort)
                count = len(re.findall(r'\b' + re.escape(word) + r'\b', analysis_text))
                category_scores[category] += count
                
                # Zusätzlichen Bonus für Vorkommen im Titel oder in der Beschreibung
                if word in title.lower():
                    category_scores[category] += 3
                if word in description.lower():
                    category_scores[category] += 2
        
        # Spezielle Muster erkennen, die auf bestimmte Kategorien hindeuten
        
        # Schule: Schulnamen, Bildungseinrichtungen
        if re.search(r'\b(grundschule|gymnasium|oberschule|gesamtschule)\b', analysis_text, re.IGNORECASE):
            category_scores['school'] += 5
            
        # Amt: Typische Behördenhinweise, Öffnungszeiten, etc.
        if re.search(r'\b(sprechzeiten|öffnungszeiten|antragsformular|dienstleistung)\b', analysis_text, re.IGNORECASE):
            category_scores['office'] += 5
            
        # Veranstaltung: Datums- und Zeitangaben, typische Veranstaltungshinweise
        if re.search(r'\b\d{1,2}\.\d{1,2}\.\d{4}\b|\b\d{1,2}:\d{2}\s?uhr\b|am\s+\d{1,2}\.\s+\w+', analysis_text, re.IGNORECASE):
            category_scores['event'] += 3
            
        if re.search(r'\b(findet statt|veranstaltet|eingeladen|teilnehmen)\b', analysis_text, re.IGNORECASE):
            category_scores['event'] += 3
        
        # Die Kategorie mit der höchsten Punktzahl auswählen
        max_category = max(category_scores.items(), key=lambda x: x[1])
        
        # Nur kategorisieren, wenn die Punktzahl über einem Schwellenwert liegt
        if max_category[1] >= 3:
            return max_category[0]
        else:
            return "other"
    
    def _extract_address_from_text(self, text: str) -> Optional[str]:
        """
        Extrahiert eine Adresse aus einem Text.
        
        Args:
            text: Text, der eine Adresse enthalten könnte
            
        Returns:
            Optional[str]: Extrahierte Adresse oder None
        """
        # Muster für Straße mit Hausnummer
        street_pattern = r'([A-Z][a-zäöüß\-]+(?:straße|weg|allee|platz|gasse|damm|ring|ufer))\s+(\d+[a-z]?)'
        
        # Muster für PLZ und Ort
        plz_city_pattern = r'(\d{5})\s+([A-Z][a-zäöüß\-]+(?:\s+[A-Z][a-zäöüß\-]+)*)'
        
        # Adresse suchen
        street_match = re.search(street_pattern, text, re.IGNORECASE)
        plz_city_match = re.search(plz_city_pattern, text)
        
        if street_match:
            address = f"{street_match.group(0)}"
            
            # Wenn PLZ und Ort gefunden wurden, zur Adresse hinzufügen
            if plz_city_match:
                address += f", {plz_city_match.group(0)}"
                
            return address
            
        return None
    
    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """
        Extrahiert Kontaktinformationen aus einem Text.
        
        Args:
            text: Text, der Kontaktinformationen enthalten könnte
            
        Returns:
            Dict[str, str]: Dictionary mit Kontaktinformationen
        """
        contact = {}
        
        # Telefonnummer extrahieren
        phone_patterns = [
            r'(?:Tel(?:efon)?|Fon)[.:]\s*(\(?\d{3,5}\)?\s*[-/]?\s*\d{5,8})',
            r'(?:Tel(?:efon)?|Fon)[.:]\s*(\(?\d{2,5}\)?\s*[-/]?\s*\d{2,4}\s*[-/]?\s*\d{2,4})',
            r'(?:Tel(?:efon)?|Fon)[.:]\s*(\+\d{2}\s*\d{2,5}\s*[-/]?\s*\d{5,8})',
            r'(?<!\S)(\(?\d{3,5}\)?\s*[-/]?\s*\d{5,8})(?!\S)'
        ]
        
        for pattern in phone_patterns:
            phone_match = re.search(pattern, text)
            if phone_match:
                contact['phone'] = phone_match.group(1)
                break
        
        # E-Mail extrahieren
        email_pattern = r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)'
        email_match = re.search(email_pattern, text)
        if email_match:
            contact['email'] = email_match.group(1)
        
        # Website extrahieren
        website_patterns = [
            r'(?:www\.(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)',
            r'(?:https?://(?:www\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:/[^\s]*)?)'
        ]
        
        for pattern in website_patterns:
            website_match = re.search(pattern, text)
            if website_match:
                website = website_match.group(0)
                if not website.startswith('http'):
                    website = 'https://' + website
                contact['website'] = website
                break
        
        return contact
    
    def _extract_date_time(self, text: str) -> Dict[str, str]:
        """
        Extrahiert Datums- und Zeitinformationen aus einem Text.
        
        Args:
            text: Text, der Datums- und Zeitinformationen enthalten könnte
            
        Returns:
            Dict[str, str]: Dictionary mit Datums- und Zeitinformationen
        """
        result = {}
        
        # Datum im Format DD.MM.YYYY oder DD. Monat YYYY extrahieren
        date_patterns = [
            r'(\d{1,2})\.(\d{1,2})\.(\d{4})',  # DD.MM.YYYY
            r'(\d{1,2})\.\s+(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})'  # DD. Monat YYYY
        ]
        
        for pattern in date_patterns:
            date_match = re.search(pattern, text, re.IGNORECASE)
            if date_match:
                if len(date_match.groups()) == 3:
                    if re.match(r'\d+', date_match.group(2)):  # Numerisches Mönatsformat
                        result['date'] = f"{date_match.group(1)}.{date_match.group(2)}.{date_match.group(3)}"
                    else:  # Ausgeschriebener Monat
                        result['date'] = f"{date_match.group(1)}. {date_match.group(2)} {date_match.group(3)}"
                break
        
        # Uhrzeit extrahieren
        time_patterns = [
            r'(\d{1,2})[:.](\d{2})\s*(?:Uhr|h)?',  # HH:MM Uhr oder HH.MM Uhr
            r'(\d{1,2})\s*Uhr'  # HH Uhr
        ]
        
        for pattern in time_patterns:
            time_match = re.search(pattern, text, re.IGNORECASE)
            if time_match:
                if len(time_match.groups()) == 2:
                    result['time'] = f"{time_match.group(1)}:{time_match.group(2)} Uhr"
                else:
                    result['time'] = f"{time_match.group(1)}:00 Uhr"
                break
        
        return result
    
    def _process_nachricht_element(self, nachricht_elem) -> Dict[str, Any]:
        """
        Verarbeitet ein <nachricht>-Element und extrahiert strukturierte Daten.
        
        Args:
            nachricht_elem: XML-Element vom Typ <nachricht>
            
        Returns:
            Dict[str, Any]: Extrahierte strukturierte Daten
        """
        try:
            # Basisdaten aus dem Nachrichtenelement extrahieren
            title = self._get_element_text(nachricht_elem, "./n") or self._get_element_text(nachricht_elem, "./name") or ""
            description = self._get_element_text(nachricht_elem, "./beschreibung") or ""
            content = self._get_element_text(nachricht_elem, "./haupttext") or ""
            link = self._get_element_text(nachricht_elem, "./link") or ""
            
            # Kategorie der Nachricht bestimmen
            category = self._categorize_message(title, description, content)
            
            # Zusätzliche Informationen aus dem Inhalt extrahieren
            address = self._extract_address_from_text(content) or self._extract_address_from_text(description)
            contact_info = self._extract_contact_info(content)
            date_time = self._extract_date_time(content)
            
            # Daten entsprechend der Kategorie strukturieren
            if category == "school":
                data = {
                    "type": "school",
                    "data": {
                        "name": title,
                        "type": self._detect_school_type(title + " " + description + " " + content),
                        "address": address or "",
                        "contact": contact_info,
                        "additionalInfo": description,
                        "details": {
                            "description": content,
                            "link": link
                        }
                    }
                }
            elif category == "office":
                data = {
                    "type": "office",
                    "data": {
                        "name": title,
                        "department": self._extract_department(title, content),
                        "address": address or "",
                        "openingHours": self._extract_opening_hours(content) or "",
                        "contact": contact_info,
                        "services": self._extract_services_from_text(content),
                        "description": description,
                        "details": {
                            "content": content,
                            "link": link
                        }
                    }
                }
            elif category == "event":
                data = {
                    "type": "event",
                    "data": {
                        "title": title,
                        "date": date_time.get("date", ""),
                        "time": date_time.get("time", ""),
                        "location": address or self._extract_location(content) or "",
                        "description": description,
                        "content": content,
                        "organizer": self._extract_organizer(content) or "",
                        "contact": contact_info,
                        "link": link
                    }
                }
            else:
                # Kategorie 'other' - allgemeine Nachrichtenstruktur
                return None
            
            # Null-Werte entfernen
            data = self._clean_empty_values(data)
            return data
            
        except Exception as e:
            logger.error(f"Fehler beim Verarbeiten eines Nachricht-Elements: {str(e)}")
            return None
    
    def _detect_school_type(self, text: str) -> str:
        """Erkennt den Schultyp aus dem Text."""
        text = text.lower()
        if "grundschule" in text:
            return "Grundschule"
        elif "gesamtschule" in text:
            return "Gesamtschule"
        elif "gymnasium" in text:
            return "Gymnasium"
        elif "oberschule" in text:
            return "Oberschule"
        elif "förderschule" in text or "sonderschule" in text:
            return "Förderschule"
        elif "berufsschule" in text or "berufliche schule" in text:
            return "Berufsschule"
        elif "schule" in text:
            return "Schule"
        return "Andere Bildungseinrichtung"
    
    def _extract_department(self, title: str, content: str) -> str:
        """Extrahiert die Abteilung aus Titel und Inhalt."""
        # Typische Abteilungsbezeichnungen in städtischen Behörden
        departments = [
            "Bürgerservice", "Einwohnermeldeamt", "Standesamt", "Ordnungsamt",
            "Sozialamt", "Jugendamt", "Bauamt", "Stadtplanung", "Umweltamt",
            "Kulturamt", "Schulamt", "Gesundheitsamt", "Finanzamt", "Steueramt"
        ]
        
        full_text = f"{title} {content}"
        
        for dept in departments:
            if dept.lower() in full_text.lower():
                return dept
                
        return ""
    
    def _extract_opening_hours(self, text: str) -> Optional[str]:
        """Extrahiert Öffnungszeiten aus einem Text."""
        patterns = [
            r'(?:Öffnungszeiten|Sprechzeiten|Servicezeiten)(?:[\s:]+)([^\.;]+)',
            r'(?:geöffnet|offen)(?:[\s:]+)([^\.;]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return None
    
    def _extract_services_from_text(self, text: str) -> List[str]:
        """Extrahiert Dienstleistungen aus einem Text."""
        services = []
        
        # Nach Aufzählungen suchen (z.B. mit Bulletpoints oder Nummern)
        patterns = [
            r'(?:Leistungen|Angebote|Services|Dienstleistungen)(?:[\s:]+)((?:[^\n]+\n)+)',
            r'(?:bieten|bietet|anbieten|angeboten)(?:[^:]+):([^\.;]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                service_text = match.group(1)
                # Zerlegen nach Zeilenumbrüchen, Kommas oder Semikolons
                items = re.split(r'[,;\n]', service_text)
                services.extend([item.strip() for item in items if item.strip()])
        
        return services[:5]  # Maximal 5 Dienste zurückgeben
    
    def _extract_location(self, text: str) -> Optional[str]:
        """Extrahiert einen Veranstaltungsort aus einem Text."""
        patterns = [
            r'(?:Ort|Veranstaltungsort|Location|findet statt in|findet statt am|findet statt im)(?:[\s:]+)([^\.;,]+)',
            r'(?:in|im|am)\s+([A-Z][a-zäöüß\-]+(?:\s+[A-Z][a-zäöüß\-]+)*)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return None
    
    def _extract_organizer(self, text: str) -> Optional[str]:
        """Extrahiert einen Veranstalter aus einem Text."""
        patterns = [
            r'(?:Veranstalter|Organisator|Ausrichter|organisiert von|veranstaltet von)(?:[\s:]+)([^\.;,]+)',
            r'(?:Die|Der)\s+([A-Z][a-zäöüß\-]+(?:\s+[A-Z][a-zäöüß\-]+)*)\s+(?:veranstaltet|organisiert|lädt ein)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
                
        return None
        
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
        
        # Zuerst nach expliziten <school>-Elementen suchen
        school_elements = self.root.findall(".//school") or self.root.findall(".//Schule")
        
        # Schulen aus expliziten <school>-Elementen extrahieren
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
        
        # Nach <nachricht>-Elementen suchen, die Schulen enthalten könnten
        nachricht_elements = self.root.findall(".//nachricht")
        
        for nachricht_elem in nachricht_elements:
            try:
                # Nachricht verarbeiten und strukturierte Daten extrahieren
                data = self._process_nachricht_element(nachricht_elem)
                
                # Nur Schuldaten hinzufügen
                if data and data["type"] == "school":
                    schools.append(data)
                    
            except Exception as e:
                logger.error(f"Fehler beim Verarbeiten eines Nachricht-Elements für Schulen: {str(e)}")
        
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
        
        # Zuerst nach expliziten <office>-Elementen suchen
        office_elements = self.root.findall(".//office") or self.root.findall(".//Amt")
        
        # Ämter aus expliziten <office>-Elementen extrahieren
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
        
        # Nach <nachricht>-Elementen suchen, die Ämter enthalten könnten
        nachricht_elements = self.root.findall(".//nachricht")
        
        for nachricht_elem in nachricht_elements:
            try:
                # Nachricht verarbeiten und strukturierte Daten extrahieren
                data = self._process_nachricht_element(nachricht_elem)
                
                # Nur Amtsdaten hinzufügen
                if data and data["type"] == "office":
                    offices.append(data)
                    
            except Exception as e:
                logger.error(f"Fehler beim Verarbeiten eines Nachricht-Elements für Ämter: {str(e)}")
        
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
        
        # Zuerst nach expliziten <event>-Elementen suchen
        event_elements = self.root.findall(".//event") or self.root.findall(".//Veranstaltung")
        
        # Veranstaltungen aus expliziten <event>-Elementen extrahieren
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
        
        # Nach <nachricht>-Elementen suchen, die Veranstaltungen enthalten könnten
        nachricht_elements = self.root.findall(".//nachricht")
        
        for nachricht_elem in nachricht_elements:
            try:
                # Nachricht verarbeiten und strukturierte Daten extrahieren
                data = self._process_nachricht_element(nachricht_elem)
                
                # Nur Veranstaltungsdaten hinzufügen
                if data and data["type"] == "event":
                    events.append(data)
                    
            except Exception as e:
                logger.error(f"Fehler beim Verarbeiten eines Nachricht-Elements für Veranstaltungen: {str(e)}")
        
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
    
    def _get_services(self, parent_elem, xpath: str = "./services/service") -> List[str]:
        """Extrahiert Dienstleistungen aus einem Element basierend auf einem XPath-Ausdruck"""
        try:
            elements = parent_elem.findall(xpath)
            return [element.text.strip() for element in elements if element is not None and element.text]
        except Exception:
            return []
    
    def _clean_empty_values(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Entfernt leere oder None-Werte aus einem Dictionary"""
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                if isinstance(value, dict):
                    cleaned = self._clean_empty_values(value)
                    if cleaned:  # Nur nicht-leere Dictionaries behalten
                        result[key] = cleaned
                elif isinstance(value, list):
                    cleaned = [self._clean_empty_values(item) if isinstance(item, dict) else item 
                              for item in value if item is not None and item != ""]
                    if cleaned:  # Nur nicht-leere Listen behalten
                        result[key] = cleaned
                elif value is not None and value != "":
                    result[key] = value
            return result
        else:
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