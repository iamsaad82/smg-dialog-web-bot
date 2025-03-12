"""
Factory-Modul für interaktive Elemente.
Stellt eine zentrale Schnittstelle zur Erzeugung von interaktiven Elementen bereit.
"""

from typing import Dict, List, Any, Optional
import re
from . import InteractiveElement, InteractiveResponse
from .contact_card import ContactElement, ContactExtractor
from .intent_detection import IntentDetector
import logging

logger = logging.getLogger(__name__)

class InteractiveElementFactory:
    """Factory-Klasse zur Erzeugung interaktiver Elemente."""
    
    def __init__(self):
        self._element_extractors = {}
        self._element_creators = {
            "contact_card": self._create_contact_card
        }
        # Intent-Detektor initialisieren
        self._intent_detector = IntentDetector()
        
        # Kontakt-bezogene Muster für einfache Pattern-basierte Intent-Erkennung (Fallback)
        self._contact_patterns = [
            r'kontakt\w*', r'telefon\w*', r'nummer\w*', r'anruf\w*', 
            r'email\w*', r'mail\w*', r'adresse\w*', r'standort\w*', 
            r'öffnungszeit\w*', r'sprechstunde\w*', r'info\w*', 
            r'erreichbar\w*', r'verbind\w*', r'wie erreiche ich',
            r'wo finde ich', r'wenden an', r'zuständig', r'büro',
            r'wie komme ich', r'wann ist', r'geöffnet'
        ]
    
    def register_tenant_config(self, tenant_id: str, config: Dict[str, Any]) -> None:
        """
        Registriert die Konfiguration für einen Mandanten.
        
        :param tenant_id: ID des Mandanten
        :param config: Konfiguration mit interaktiven Elementen
        """
        if "contacts" in config:
            self._element_extractors[tenant_id] = {
                "contact_card": ContactExtractor(config)
            }
            logger.info(f"Registered contact extractor for tenant {tenant_id} with {len(config.get('contacts', []))} contacts")
    
    def extract_interactive_elements(
        self, 
        tenant_id: str, 
        query: str, 
        doc_texts: List[str]
    ) -> List[InteractiveElement]:
        """
        Extrahiert interaktive Elemente aus der Anfrage und den Dokumenten.
        
        :param tenant_id: ID des Mandanten
        :param query: Die Benutzeranfrage
        :param doc_texts: Texte der gefundenen Dokumente
        :return: Liste der extrahierten interaktiven Elemente
        """
        elements = []
        
        # Intent-Erkennung durchführen
        is_contact_intent, confidence = self._detect_contact_intent(query)
        logger.info(f"Kontakt-Intent erkannt: {is_contact_intent}, Konfidenz: {confidence:.2f}")
        
        # Wenn kein starker Kontakt-Intent, früh beenden
        if not is_contact_intent and confidence < 0.3:
            logger.debug(f"Kein Kontakt-Intent erkannt in: '{query}'")
            return elements
        
        # Prüfen, ob der Tenant registriert ist
        if tenant_id not in self._element_extractors:
            logger.warning(f"No extractors registered for tenant {tenant_id}")
            return elements
        
        # Kontaktkarten extrahieren
        if "contact_card" in self._element_extractors[tenant_id]:
            contact_extractor = self._element_extractors[tenant_id]["contact_card"]
            contacts = contact_extractor.extract_contacts(query, doc_texts)
            
            # Nur die besten Kontakte verwenden (max. 2)
            for contact in contacts[:2]:
                # Wenn es ein starker Kontakt-Intent ist, Schwellwert senken
                min_relevance = 0.7 if is_contact_intent else 1.0
                if contact.get("relevance_score", 0) > min_relevance:  # Mindest-Relevanz
                    elements.append(self._create_contact_card(contact, tenant_id))
            
            # Wenn Kontakt-Intent erkannt, aber keine passenden Kontakte gefunden wurden
            if is_contact_intent and confidence > 0.6 and not elements and contacts:
                # Den besten verfügbaren Kontakt nehmen, auch wenn Score niedrig
                elements.append(self._create_contact_card(contacts[0], tenant_id))
                logger.info(f"Fallback-Kontakt hinzugefügt aufgrund von starkem Intent: {contacts[0].get('name')}")
        
        return elements
    
    def _detect_contact_intent(self, query: str) -> tuple[bool, float]:
        """
        Erkennt, ob die Anfrage nach Kontaktinformationen fragt.
        
        :param query: Die Benutzeranfrage
        :return: Tuple aus (ist_kontakt_intent, konfidenz)
        """
        # Embedding-basierte Erkennung verwenden
        return self._intent_detector.detect_contact_intent(query)
    
    def _create_contact_card(self, data: Dict[str, Any], tenant_id: str) -> InteractiveElement:
        """Erstellt ein Kontaktkarten-Element."""
        return ContactElement(data, tenant_id)

# Singleton-Instanz
interactive_factory = InteractiveElementFactory() 