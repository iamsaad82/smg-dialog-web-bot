"""
Interaktives Antwort-Modul für den ChatBot.
Ermöglicht strukturierte Datenextraktion und interaktive UI-Elemente in Antworten.
"""

from typing import Dict, List, Any, Optional

class InteractiveElement:
    """Basisklasse für interaktive Elemente in Bot-Antworten."""
    
    def __init__(self, element_type: str, data: Dict[str, Any], tenant_id: str):
        self.type = element_type
        self.data = data
        self.tenant_id = tenant_id
    
    def to_json(self) -> Dict[str, Any]:
        """Konvertiert das interaktive Element in ein JSON-Format."""
        return {
            "type": self.type,
            "data": self.data
        }

class InteractiveResponse:
    """Container für Text und interaktive Elemente."""
    
    def __init__(self, text: str, elements: Optional[List[InteractiveElement]] = None):
        self.text = text
        self.elements = elements or []
    
    def add_element(self, element: InteractiveElement) -> None:
        """Fügt ein interaktives Element hinzu."""
        self.elements.append(element)
    
    def to_json(self) -> Dict[str, Any]:
        """Konvertiert die gesamte Antwort in ein JSON-Format."""
        return {
            "text": self.text,
            "interactive_elements": [
                element.to_json() for element in self.elements
            ]
        } 