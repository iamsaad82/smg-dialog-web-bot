"""
Kontaktkarten-Adapter für interaktive Bot-Antworten.
Extrahiert Kontaktinformationen aus Dokumenten und erstellt interaktive Kontaktkarten.
"""

from typing import Dict, List, Any, Optional
import re
import logging
from . import InteractiveElement

# Logger konfigurieren
logger = logging.getLogger(__name__)

class ContactElement(InteractiveElement):
    """Ein interaktives Element, das Kontaktinformationen darstellt."""
    
    def __init__(self, contact_data: Dict[str, Any], tenant_id: str):
        """
        Initialisiert ein Kontaktkarten-Element.
        
        :param contact_data: Ein Dictionary mit Kontaktinformationen
        :param tenant_id: Die ID des Mandanten
        """
        super().__init__("contact_card", contact_data, tenant_id)

class ContactExtractor:
    """Extrahiert Kontaktinformationen aus Dokumenten."""
    
    def __init__(self, tenant_config: Dict[str, Any]):
        """
        Initialisiert den Kontaktextrahierer.
        
        :param tenant_config: Konfiguration des Mandanten mit Kontaktdefinitionen
        """
        self.tenant_config = tenant_config
        # Kontaktentitäten aus der Konfiguration laden
        self.contacts = tenant_config.get("contacts", [])
        self.keywords = self._build_keyword_index()
        
        logger.info(f"ContactExtractor initialisiert mit {len(self.contacts)} Kontakten")
        logger.info(f"Keyword-Index erstellt mit {len(self.keywords)} Schlüsselwörtern")
    
    def _build_keyword_index(self) -> Dict[str, List[str]]:
        """Baut einen Index von Keywords zu Kontakt-IDs auf."""
        keyword_index = {}
        for contact in self.contacts:
            contact_id = contact.get("id")
            logger.debug(f"Verarbeite Kontakt: {contact.get('name')} (ID: {contact_id})")
            
            for keyword in contact.get("keywords", []):
                keyword = keyword.lower()
                if keyword not in keyword_index:
                    keyword_index[keyword] = []
                keyword_index[keyword].append(contact_id)
                logger.debug(f"  Keyword '{keyword}' -> Kontakt-ID {contact_id}")
        
        return keyword_index
    
    def extract_contacts(self, query: str, doc_texts: List[str]) -> List[Dict[str, Any]]:
        """
        Extrahiert relevante Kontakte basierend auf der Anfrage und gefundenen Dokumenten.
        
        :param query: Die Benutzeranfrage
        :param doc_texts: Texte der relevanten Dokumente
        :return: Liste der gefundenen Kontakte in absteigender Relevanz
        """
        logger.info(f"Kontaktsuche für Anfrage: '{query}'")
        
        # Relevante Keywords aus der Anfrage extrahieren
        keywords = self._extract_keywords(query.lower())
        logger.info(f"Extrahierte Keywords: {keywords}")
        
        # Relevante Kontakt-IDs sammeln
        contact_scores = {}
        
        # Durch Keywords iterieren und Scores berechnen
        for keyword in keywords:
            if keyword in self.keywords:
                for contact_id in self.keywords[keyword]:
                    if contact_id not in contact_scores:
                        contact_scores[contact_id] = 0
                    contact_scores[contact_id] += 1
                    logger.debug(f"Keyword-Match: '{keyword}' -> Kontakt {contact_id}, Score +1")
        
        # Kontextuelles Scoring basierend auf Dokumenten
        for i, doc_text in enumerate(doc_texts):
            doc_lower = doc_text.lower()
            for contact in self.contacts:
                contact_id = contact.get("id")
                name = contact.get("name", "").lower()
                
                # Wenn der Kontaktname im Dokument erwähnt wird
                if name and name in doc_lower:
                    if contact_id not in contact_scores:
                        contact_scores[contact_id] = 0
                    contact_scores[contact_id] += 2  # Höhere Gewichtung für direkte Erwähnungen
                    logger.debug(f"Name-Match: '{name}' in Dokument {i}, Kontakt {contact_id}, Score +2")
        
        logger.info(f"Kontakt-Scores: {contact_scores}")
        
        # Sortierte Liste der relevanten Kontakte erstellen
        relevant_contacts = []
        for contact_id, score in sorted(contact_scores.items(), key=lambda x: x[1], reverse=True):
            # Kontakt mit dieser ID finden
            for contact in self.contacts:
                if contact.get("id") == contact_id:
                    contact_with_score = contact.copy()
                    contact_with_score["relevance_score"] = score
                    relevant_contacts.append(contact_with_score)
                    logger.info(f"Relevanter Kontakt: {contact.get('name')}, Score: {score}")
                    break
        
        logger.info(f"Gefunden: {len(relevant_contacts)} relevante Kontakte")
        return relevant_contacts
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extrahiert relevante Keywords aus dem Text."""
        # Verbesserte Methode mit kontextsensitiver Erkennung
        keywords = []
        
        # Einfache Wörter mit mindestens 4 Buchstaben
        simple_words = re.findall(r'\b\w{4,}\b', text)
        keywords.extend(simple_words)
        
        # Suche nach expliziten Hinweisen auf Kontakte
        contact_patterns = [
            r'kontakt\w*', r'telefon\w*', r'nummer\w*', r'anruf\w*', 
            r'email\w*', r'mail\w*', r'adresse\w*', r'standort\w*', 
            r'öffnungszeit\w*', r'sprechstunde\w*', r'info\w*', 
            r'erreichbar\w*', r'verbind\w*'
        ]
        
        for pattern in contact_patterns:
            if re.search(pattern, text):
                logger.debug(f"Kontakt-Pattern gefunden: '{pattern}' in '{text}'")
                keywords.append('kontakt')  # Spezialschlüssel für Kontakt-bezogene Anfragen
        
        return keywords 