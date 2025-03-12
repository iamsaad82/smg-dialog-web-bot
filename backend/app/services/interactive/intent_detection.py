"""
Intent-Erkennung für interaktive Elemente.
Verwendet Embedding-Modelle zur semantischen Analyse von Benutzeranfragen.
"""

from typing import List, Tuple, Dict, Any
import numpy as np
import logging
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

class IntentDetector:
    """Erkennt die Absicht (Intent) in Benutzeranfragen mit Embedding-Modellen."""
    
    def __init__(self):
        """Initialisiert den Intent-Detektor mit einem Embedding-Modell."""
        # Lazy-Loading des Modells, um Ressourcen zu sparen
        self._model = None
        self._contact_examples = [
            # Allgemeine Kontaktfragen
            "Wie kann ich Kontakt aufnehmen?",
            "An wen kann ich mich wenden?",
            "Wie erreiche ich euch?",
            "Wer ist zuständig?",
            
            # Umgangssprachliche Formulierungen
            "Wo finde ich jemanden der mir helfen kann?",
            "Ich will wissen wo die sind",
            "Habt ihr eine Telefonnummer?",
            "Kann man da anrufen?",
            
            # Spezifische Kontaktanfragen
            "Telefonnummer bitte",
            "Email Adresse",
            "Öffnungszeiten",
            "Wann haben die auf?",
            
            # Implizite Kontaktsuche
            "Ich brauche Hilfe bei...",
            "Wo muss ich hin für...?",
            "Wer kann mir helfen mit...?",
            "Wie komme ich dahin?",
            
            # Branchenspezifische Formulierungen
            "Zuständige Behörde für...",
            "Sprechstunden",
            "Amt für...",
            "Welche Dienststelle...?"
        ]
        self._contact_embeddings = None
        
        # Fallback-Methoden, falls Embedding-Modell nicht verfügbar
        self._contact_keywords = [
            'kontakt', 'anruf', 'telefon', 'mail', 'email', 'adresse', 
            'öffnungszeit', 'erreichen', 'finden', 'wo', 'wann', 'zuständig',
            'behörde', 'amt', 'dienststelle', 'hilfe', 'unterstützung',
            'beratung', 'service'
        ]
    
    @property
    def model(self):
        """Lazy-Loading des Embedding-Modells."""
        if self._model is None:
            try:
                logger.info("Lade Sentence-Transformer-Modell...")
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
                # Embeddings vorberechnen
                self._contact_embeddings = self._model.encode(self._contact_examples)
                logger.info("Modell erfolgreich geladen und Beispiel-Embeddings berechnet")
            except Exception as e:
                logger.error(f"Fehler beim Laden des Embedding-Modells: {e}")
                logger.warning("Fallback auf Keyword-basierte Intent-Erkennung")
                self._model = False  # False als Marker, dass das Modell nicht verfügbar ist
        return self._model
    
    def detect_contact_intent(self, query: str) -> Tuple[bool, float]:
        """
        Erkennt, ob die Anfrage wahrscheinlich nach Kontaktinformationen fragt.
        
        :param query: Die Benutzeranfrage
        :return: Tuple aus (ist_kontakt_intent, konfidenz)
        """
        logger.debug(f"Intent-Erkennung für: '{query}'")
        
        # Versuche, das Embedding-Modell zu verwenden
        if self.model and self.model is not False:
            try:
                query_embedding = self.model.encode(query)
                # Berechne Ähnlichkeit mit allen Beispielen
                similarities = cosine_similarity(
                    query_embedding.reshape(1, -1), 
                    self._contact_embeddings
                )[0]
                max_similarity = np.max(similarities)
                is_contact = max_similarity > 0.6
                
                logger.debug(f"Embedding-basierte Intent-Erkennung: {is_contact}, Score: {max_similarity:.4f}")
                return is_contact, float(max_similarity)
            except Exception as e:
                logger.error(f"Fehler bei Embedding-basierter Intent-Erkennung: {e}")
                # Fallback auf Keyword-Methode
        
        # Keyword-basierte Methode (Fallback)
        query_lower = query.lower()
        word_count = sum(1 for word in self._contact_keywords if word in query_lower)
        confidence = min(0.9, word_count * 0.15)  # Max 0.9 Konfidenz bei 6+ Wörtern
        
        is_contact = confidence > 0.3
        logger.debug(f"Keyword-basierte Intent-Erkennung: {is_contact}, Score: {confidence:.4f}")
        
        return is_contact, confidence 