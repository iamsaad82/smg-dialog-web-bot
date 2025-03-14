"""
Hilfsfunktionen für die Verarbeitung von UUIDs und Strings für konsistente ID-Handhabung.

Dieses Modul bietet Tools zum Konvertieren und Überprüfen von UUIDs, was die Kompatibilität
zwischen verschiedenen Typen (str, UUID) im gesamten System verbessert.
"""

import uuid
from typing import Union, Any, Optional

def is_valid_uuid(value: Any) -> bool:
    """
    Überprüft, ob ein Wert ein gültiges UUID-Format hat.
    
    Args:
        value: Der zu prüfende Wert (String oder UUID-Objekt)
        
    Returns:
        bool: True, wenn es ein gültiges UUID ist, sonst False
    """
    if isinstance(value, uuid.UUID):
        return True
        
    if not isinstance(value, str):
        return False
        
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError, TypeError):
        return False

def to_uuid(value: Union[str, uuid.UUID]) -> uuid.UUID:
    """
    Konvertiert einen String zu einer UUID, wenn möglich.
    Lässt UUID-Objekte unverändert durch.
    
    Args:
        value: Der zu konvertierende Wert (String oder UUID-Objekt)
        
    Returns:
        uuid.UUID: Das konvertierte UUID-Objekt
        
    Raises:
        ValueError: Wenn der Wert nicht zu einer UUID konvertiert werden kann
    """
    if isinstance(value, uuid.UUID):
        return value
        
    try:
        return uuid.UUID(str(value))
    except (ValueError, AttributeError, TypeError):
        raise ValueError(f"Konnte {value} nicht zu UUID konvertieren")

def to_str(value: Union[str, uuid.UUID]) -> str:
    """
    Konvertiert ein UUID-Objekt zu einem String.
    Lässt Strings unverändert durch.
    
    Args:
        value: Der zu konvertierende Wert (String oder UUID-Objekt)
        
    Returns:
        str: Die UUID als String
    """
    if isinstance(value, str):
        return value
        
    return str(value)

def get_clean_uuid(value: Optional[Union[str, uuid.UUID]] = None) -> str:
    """
    Erzeugt eine neue UUID als String oder konvertiert den übergebenen Wert.
    Entfernt automatisch alle Bindestriche.
    
    Args:
        value: Optional ein zu konvertierender Wert (String oder UUID-Objekt)
        
    Returns:
        str: Eine UUID als String ohne Bindestriche
    """
    if value is None:
        uuid_str = str(uuid.uuid4())
    else:
        uuid_str = to_str(value)
        
    return uuid_str.replace('-', '') 