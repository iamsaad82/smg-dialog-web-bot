"""
Modul für das WeaviateStatus-Modell, das den Indizierungsstatus von Dokumenten in Weaviate darstellt.
"""

from pydantic import BaseModel
from typing import Optional, Literal
from enum import Enum

class IndexStatus(str, Enum):
    """Enum für den Indizierungsstatus eines Dokuments."""
    INDIZIERT = "INDIZIERT"        # Dokument ist vollständig indiziert und durchsuchbar
    NICHT_INDIZIERT = "NICHT_INDIZIERT"  # Dokument ist noch nicht indiziert
    FEHLER = "FEHLER"            # Bei der Indizierung ist ein Fehler aufgetreten

class WeaviateStatus(BaseModel):
    """Schema für den Weaviate-Status eines Dokuments"""
    status: IndexStatus  # Der aktuelle Status des Dokuments
    lastUpdated: Optional[str] = None  # Zeitpunkt der letzten Aktualisierung
    error: Optional[str] = None  # Fehlerinformationen, falls vorhanden 