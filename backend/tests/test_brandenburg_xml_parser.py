import os
import sys
import tempfile
import unittest
from pathlib import Path

# Pfad zum Root-Verzeichnis des Projekts hinzufügen
sys.path.append(str(Path(__file__).parent.parent))

from app.services.xml_parser_service import BrandenburgXMLParser

class TestBrandenburgXMLParser(unittest.TestCase):
    """Tests für den Brandenburg XML Parser"""
    
    def setUp(self):
        """Setup für die Tests - erstellt eine temporäre XML-Datei mit Beispieldaten"""
        
        # Beispiel-XML-Datei mit dem Format der Stadt Brandenburg
        self.test_xml_content = """<?xml version="1.0" encoding="UTF-8"?>
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
        # Temporäre Datei erstellen
        self.temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".xml")
        self.temp_file.write(self.test_xml_content.encode('utf-8'))
        self.temp_file.close()
        
        # Parser mit temporärer Datei initialisieren
        self.parser = BrandenburgXMLParser(self.temp_file.name)
        self.parser.parse_file()
        
    def tearDown(self):
        """Cleanup nach den Tests - löscht die temporäre XML-Datei"""
        os.unlink(self.temp_file.name)
    
    def test_extract_schools(self):
        """Test, ob Schulen korrekt extrahiert werden"""
        schools = self.parser.extract_schools()
        
        # Prüfen, ob genau eine Schule gefunden wurde
        self.assertEqual(len(schools), 1, "Es sollte genau eine Schule extrahiert werden")
        
        # Prüfen der Schuldaten
        school = schools[0]["data"]
        self.assertEqual(school["name"], "Grundschule Am Beispiel - Tag der offenen Tür")
        self.assertEqual(school["type"], "Grundschule")
        self.assertIn("contact", school)
        self.assertIn("phone", school["contact"])
        self.assertEqual(school["contact"]["phone"], "03381-12345")
        self.assertEqual(school["contact"]["email"], "grundschule@beispiel.de")
        self.assertEqual(school["contact"]["website"], "https://www.grundschule-beispiel.de")
        
        # Prüfen, ob das Datum korrekt extrahiert wurde
        self.assertIn("details", school)
        self.assertIn("description", school["details"])
        self.assertIn("15.03.2024", school["details"]["description"])
        self.assertIn("10:00 bis 15:00 Uhr", school["details"]["description"])
    
    def test_extract_offices(self):
        """Test, ob Ämter korrekt extrahiert werden"""
        offices = self.parser.extract_offices()
        
        # Prüfen, ob genau ein Amt gefunden wurde
        self.assertEqual(len(offices), 1, "Es sollte genau ein Amt extrahiert werden")
        
        # Prüfen der Amtsdaten
        office = offices[0]["data"]
        self.assertEqual(office["name"], "Bürgeramt informiert über neue Öffnungszeiten")
        self.assertIn("address", office)
        self.assertIn("Rathausstraße 45", office["address"])
        
        # Prüfen der Öffnungszeiten
        self.assertIn("openingHours", office)
        self.assertIn("9:00 bis 18:00 Uhr", office["openingHours"])
        
        # Prüfen der Kontaktdaten
        self.assertIn("contact", office)
        self.assertEqual(office["contact"]["phone"], "03381-98765")
        self.assertEqual(office["contact"]["email"], "buergeramt@stadt.de")
        
        # Prüfen der Services
        self.assertIn("services", office)
        self.assertTrue(len(office["services"]) > 0)
    
    def test_extract_events(self):
        """Test, ob Veranstaltungen korrekt extrahiert werden"""
        events = self.parser.extract_events()
        
        # Prüfen, ob genau eine Veranstaltung gefunden wurde
        self.assertEqual(len(events), 1, "Es sollte genau eine Veranstaltung extrahiert werden")
        
        # Prüfen der Veranstaltungsdaten
        event = events[0]["data"]
        self.assertEqual(event["title"], "Stadtfest 2024 - Ein Fest für die ganze Familie")
        
        # Prüfen des Datums
        self.assertIn("date", event)
        self.assertIn("12. bis 14. Juli 2024", event["date"])
        
        # Prüfen des Ortes
        self.assertIn("location", event)
        self.assertIn("Marktplatz", event["location"])
        
        # Prüfen des Veranstalters
        self.assertIn("organizer", event)
        self.assertIn("Kulturamt", event["organizer"])
        
        # Prüfen der Kontaktdaten
        self.assertIn("contact", event)
        self.assertEqual(event["contact"]["email"], "stadtfest@brandenburg.de")
    
    def test_categorization(self):
        """Test der Kategorisierungsfunktion"""
        # Schule
        category = self.parser._categorize_message(
            "Grundschule Am Beispiel", 
            "Tag der offenen Tür", 
            "Die Grundschule lädt ein..."
        )
        self.assertEqual(category, "school")
        
        # Amt
        category = self.parser._categorize_message(
            "Bürgeramt", 
            "Neue Öffnungszeiten", 
            "Sprechzeiten und Dienstleistungen..."
        )
        self.assertEqual(category, "office")
        
        # Veranstaltung
        category = self.parser._categorize_message(
            "Stadtfest 2024", 
            "Ein Fest für alle", 
            "Am 10.06.2024 findet das Fest statt..."
        )
        self.assertEqual(category, "event")
        
        # Sonstige Nachricht
        category = self.parser._categorize_message(
            "Allgemeine Nachricht", 
            "Keine spezifische Kategorie", 
            "Dies ist ein Text ohne relevante Schlüsselwörter."
        )
        self.assertEqual(category, "other")
    
    def test_extract_address(self):
        """Test der Adressextraktionsfunktion"""
        address = self.parser._extract_address_from_text(
            "Die Veranstaltung findet in der Hauptstraße 123, 14770 Brandenburg an der Havel statt."
        )
        self.assertIsNotNone(address)
        self.assertIn("Hauptstraße 123", address)
    
    def test_extract_contact_info(self):
        """Test der Kontaktinformationsextraktionsfunktion"""
        contact = self.parser._extract_contact_info(
            "Kontakt: Tel. 03381-12345, E-Mail: kontakt@beispiel.de, Website: www.beispiel.de"
        )
        self.assertEqual(contact["phone"], "03381-12345")
        self.assertEqual(contact["email"], "kontakt@beispiel.de")
        self.assertEqual(contact["website"], "https://www.beispiel.de")

if __name__ == '__main__':
    unittest.main() 