#!/usr/bin/env python3
"""
Vereinfachtes Test-Skript für den Brandenburg XML Parser.
Dieses Skript testet die Logik des Parsers mit einer kleinen Beispiel-XML-Datei.
"""

import os
import re
import json
import tempfile
from typing import Dict, List, Any, Optional

class SimpleBrandenburgXMLParser:
    """
    Einfache Version des Brandenburg XML Parsers für Tests.
    """
    
    def __init__(self, xml_content: str):
        """
        Initialisiert den Parser mit XML-Inhalt.
        
        Args:
            xml_content: XML-Inhalt als String
        """
        self.xml_content = xml_content
        
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
    
    def parse(self) -> List[Dict[str, Any]]:
        """
        Parst das XML und extrahiert strukturierte Daten.
        
        Returns:
            Liste von strukturierten Daten
        """
        results = []
        
        # Einfaches Regex-Pattern für <nachricht>-Elemente
        pattern = r'<nachricht>(.*?)</nachricht>'
        nachricht_elements = re.findall(pattern, self.xml_content, re.DOTALL)
        
        for nachricht in nachricht_elements:
            # Basisdaten extrahieren
            title = self._extract_element(nachricht, r'<n>(.*?)</n>') or ""
            description = self._extract_element(nachricht, r'<beschreibung>(.*?)</beschreibung>') or ""
            content = self._extract_element(nachricht, r'<haupttext>(.*?)</haupttext>') or ""
            link = self._extract_element(nachricht, r'<link>(.*?)</link>') or ""
            
            # Kategorie bestimmen
            category = self._categorize_message(title, description, content)
            
            # Wenn keine relevante Kategorie gefunden wurde, überspringen
            if category == "other":
                continue
            
            # Zusätzliche Informationen extrahieren
            address = self._extract_address(content) or self._extract_address(description)
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
                results.append(data)
                
            elif category == "office":
                data = {
                    "type": "office",
                    "data": {
                        "name": title,
                        "department": self._extract_department(title, content),
                        "address": address or "",
                        "openingHours": self._extract_opening_hours(content) or "",
                        "contact": contact_info,
                        "services": self._extract_services(content),
                        "description": description,
                        "details": {
                            "content": content,
                            "link": link
                        }
                    }
                }
                results.append(data)
                
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
                results.append(data)
        
        return results
    
    def _extract_element(self, text: str, pattern: str) -> Optional[str]:
        """Extrahiert einen Elementwert mit einem Regex-Pattern"""
        match = re.search(pattern, text, re.DOTALL)
        return match.group(1).strip() if match else None
    
    def _categorize_message(self, title: str, description: str, content: str) -> str:
        """Kategorisiert eine Nachricht basierend auf ihrem Inhalt"""
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
    
    def _extract_address(self, text: str) -> Optional[str]:
        """Extrahiert eine Adresse aus einem Text"""
        # Muster für Straße mit Hausnummer
        street_pattern = r'([A-Z][a-zäöüß\-]+(?:straße|weg|allee|platz|gasse|damm|ring|ufer))\s+(\d+[a-z]?)'
        
        street_match = re.search(street_pattern, text, re.IGNORECASE)
        
        if street_match:
            return street_match.group(0)
            
        return None
    
    def _extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extrahiert Kontaktinformationen aus einem Text"""
        contact = {}
        
        # Telefonnummer extrahieren
        phone_pattern = r'(?:Tel(?:efon)?|Fon)[.:]\s*(\(?\d{3,5}\)?\s*[-/]?\s*\d{5,8})'
        phone_match = re.search(phone_pattern, text)
        if phone_match:
            contact['phone'] = phone_match.group(1)
        
        # E-Mail extrahieren
        email_pattern = r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)'
        email_match = re.search(email_pattern, text)
        if email_match:
            contact['email'] = email_match.group(1)
        
        # Website extrahieren
        website_pattern = r'(www\.[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)'
        website_match = re.search(website_pattern, text)
        if website_match:
            website = website_match.group(1)
            if not website.startswith('http'):
                website = 'https://' + website
            contact['website'] = website
        
        return contact
    
    def _extract_date_time(self, text: str) -> Dict[str, str]:
        """Extrahiert Datums- und Zeitinformationen aus einem Text"""
        result = {}
        
        # Datum im Format DD.MM.YYYY extrahieren
        date_pattern = r'(\d{1,2})\.(\d{1,2})\.(\d{4})'
        date_match = re.search(date_pattern, text)
        if date_match:
            result['date'] = f"{date_match.group(1)}.{date_match.group(2)}.{date_match.group(3)}"
        
        # Uhrzeit extrahieren
        time_pattern = r'(\d{1,2}):(\d{2})\s*(?:Uhr)?'
        time_match = re.search(time_pattern, text)
        if time_match:
            result['time'] = f"{time_match.group(1)}:{time_match.group(2)} Uhr"
        
        return result
    
    def _detect_school_type(self, text: str) -> str:
        """Erkennt den Schultyp aus dem Text"""
        text = text.lower()
        if "grundschule" in text:
            return "Grundschule"
        elif "gesamtschule" in text:
            return "Gesamtschule"
        elif "gymnasium" in text:
            return "Gymnasium"
        elif "oberschule" in text:
            return "Oberschule"
        elif "schule" in text:
            return "Schule"
        return "Andere Bildungseinrichtung"
    
    def _extract_department(self, title: str, content: str) -> str:
        """Extrahiert die Abteilung aus Titel und Inhalt"""
        departments = [
            "Bürgerservice", "Einwohnermeldeamt", "Standesamt", "Ordnungsamt",
            "Sozialamt", "Jugendamt", "Bauamt", "Stadtplanung", "Umweltamt"
        ]
        
        full_text = f"{title} {content}"
        
        for dept in departments:
            if dept.lower() in full_text.lower():
                return dept
                
        return ""
    
    def _extract_opening_hours(self, text: str) -> Optional[str]:
        """Extrahiert Öffnungszeiten aus einem Text"""
        pattern = r'(?:Öffnungszeiten|Sprechzeiten|Servicezeiten)(?:[\s:]+)([^\.;]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
                
        return None
    
    def _extract_services(self, text: str) -> List[str]:
        """Extrahiert Dienstleistungen aus einem Text"""
        services = []
        pattern = r'(?:Leistungen|Angebote|Services|Dienstleistungen)(?:[\s:]+)((?:[^\n]+\n)+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            service_text = match.group(1)
            items = re.split(r'[,;\n]', service_text)
            services = [item.strip() for item in items if item.strip()]
        
        return services[:5]  # Maximal 5 Dienste zurückgeben
    
    def _extract_location(self, text: str) -> Optional[str]:
        """Extrahiert einen Veranstaltungsort aus einem Text"""
        pattern = r'(?:Ort|Veranstaltungsort|Location|findet statt in|findet statt am|findet statt im)(?:[\s:]+)([^\.;,]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
                
        return None
    
    def _extract_organizer(self, text: str) -> Optional[str]:
        """Extrahiert einen Veranstalter aus einem Text"""
        pattern = r'(?:Veranstalter|Organisator|Ausrichter|organisiert von|veranstaltet von)(?:[\s:]+)([^\.;,]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).strip()
                
        return None

def main():
    """Hauptfunktion"""
    # Beispiel-XML-Datei mit dem Format der Stadt Brandenburg
    example_xml = """<?xml version="1.0" encoding="UTF-8"?>
<stadtportal>
<nachrichten>
    <nachricht>
        <n>Grundschule Am Beispiel - Tag der offenen Tür</n>
        <beschreibung>Die Grundschule Am Beispiel lädt zum Tag der offenen Tür ein</beschreibung>
        <haupttext>Die Grundschule Am Beispiel in der Schulstraße 123 lädt am 15.03.2024 von 10:00 bis 15:00 Uhr zum Tag der offenen Tür ein. Interessierte Eltern und zukünftige Schüler können die Schule besichtigen und mit den Lehrern sprechen. Für Fragen steht die Schulleitung unter der Telefonnummer 03381-12345 oder per E-Mail an grundschule@beispiel.de zur Verfügung. Weitere Informationen finden Sie auf der Website www.grundschule-beispiel.de</haupttext>
        <link>https://www.grundschule-beispiel.de/tag-der-offenen-tuer</link>
    </nachricht>
    
    <nachricht>
        <n>Bürgeramt informiert über neue Öffnungszeiten</n>
        <beschreibung>Neue Sprechzeiten des Bürgeramts ab Mai 2024</beschreibung>
        <haupttext>Das Bürgeramt in der Rathausstraße 45 informiert über neue Öffnungszeiten ab dem 1. Mai 2024. Die neuen Öffnungszeiten sind: Montag bis Freitag von 9:00 bis 18:00 Uhr, Donnerstag bis 20:00 Uhr. Samstags bleibt das Amt geschlossen. Zu den Dienstleistungen gehören: Beantragung von Personalausweisen, Reisepässen, Meldebescheinigungen und weiteren Dokumenten. Bei Fragen steht das Bürgeramt unter Tel. 03381-98765 oder per E-Mail an buergeramt@stadt.de zur Verfügung.</haupttext>
        <link>https://www.stadt-brandenburg.de/buergeramt</link>
    </nachricht>
    
    <nachricht>
        <n>Stadtfest 2024 - Ein Fest für die ganze Familie</n>
        <beschreibung>Vom 12. bis 14. Juli 2024 findet das große Stadtfest in Brandenburg an der Havel statt</beschreibung>
        <haupttext>Vom 12. bis 14. Juli 2024 findet das große Stadtfest in Brandenburg an der Havel statt. Der Marktplatz wird zur Festmeile mit Bühnen, Ständen und Attraktionen für die ganze Familie. Am Freitag beginnt das Fest um 15:00 Uhr mit einem Konzert der lokalen Musikschule, am Samstag gibt es ab 11:00 Uhr ein buntes Programm mit Künstlern aus der Region, und der Sonntag steht ab 10:00 Uhr ganz im Zeichen der Familien mit speziellen Angeboten für Kinder. Veranstaltet wird das Fest vom Kulturamt der Stadt in Zusammenarbeit mit lokalen Vereinen. Für Rückfragen steht das Organisationsteam unter stadtfest@brandenburg.de zur Verfügung.</haupttext>
        <link>https://www.stadtfest-brandenburg.de</link>
    </nachricht>
    
    <nachricht>
        <n>Allgemeine Nachricht ohne spezifische Kategorie</n>
        <beschreibung>Dies ist eine allgemeine Nachricht, die keiner spezifischen Kategorie zugeordnet werden sollte</beschreibung>
        <haupttext>In dieser Nachricht gibt es keine spezifischen Schlüsselwörter, die auf Schulen, Ämter oder Veranstaltungen hindeuten. Es ist einfach eine allgemeine Information, die der Parser als "other" kategorisieren sollte und nicht in die strukturierten Daten aufnehmen sollte.</haupttext>
        <link>https://www.beispiel.de/allgemein</link>
    </nachricht>
</nachrichten>
</stadtportal>
"""
    
    # XML parsen
    parser = SimpleBrandenburgXMLParser(example_xml)
    results = parser.parse()
    
    # Kategorien zählen
    categories = {}
    for item in results:
        category = item["type"]
        categories[category] = categories.get(category, 0) + 1
    
    print(f"Insgesamt {len(results)} Elemente extrahiert:")
    for category, count in categories.items():
        print(f"- {count} {category}")
    
    # Beispiele anzeigen
    for item in results:
        category = item["type"]
        data = item["data"]
        
        print(f"\n=== {category.upper()} ===")
        if category == "school":
            print(f"Name: {data.get('name', '')}")
            print(f"Typ: {data.get('type', '')}")
            print(f"Adresse: {data.get('address', '')}")
            print(f"Kontakt: {data.get('contact', {})}")
            
        elif category == "office":
            print(f"Name: {data.get('name', '')}")
            print(f"Abteilung: {data.get('department', '')}")
            print(f"Adresse: {data.get('address', '')}")
            print(f"Öffnungszeiten: {data.get('openingHours', '')}")
            print(f"Dienstleistungen: {data.get('services', [])}")
            
        elif category == "event":
            print(f"Titel: {data.get('title', '')}")
            print(f"Datum: {data.get('date', '')}")
            print(f"Zeit: {data.get('time', '')}")
            print(f"Ort: {data.get('location', '')}")
            print(f"Veranstalter: {data.get('organizer', '')}")
    
    # Ergebnisse als JSON speichern
    with open("test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("\nErgebnisse wurden in test_results.json gespeichert.")

if __name__ == "__main__":
    main() 