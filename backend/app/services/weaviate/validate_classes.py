"""
Skript zur Validierung und Reparatur von Weaviate-Klassen.
Dieses Skript kann als eigenständiges Tool oder als Teil der Anwendung ausgeführt werden.
"""

import logging
from typing import Tuple

from .health_manager import HealthManager

def validate_all_tenant_classes() -> Tuple[int, int]:
    """
    Validiert alle Tenant-Klassen in Weaviate und repariert beschädigte Klassen.
    
    Returns:
        Tuple[int, int]: (Anzahl der geprüften Klassen, Anzahl der reparierten Klassen)
    """
    logging.info("Starte Validierung aller Tenant-Klassen...")
    
    try:
        # Validiere alle Klassen
        checked, repaired = HealthManager.validate_all_tenant_classes()
        
        logging.info(f"Validierung abgeschlossen: {checked} Klassen geprüft, {repaired} Klassen repariert")
        return checked, repaired
        
    except Exception as e:
        logging.error(f"Fehler bei der Validierung der Tenant-Klassen: {e}")
        return 0, 0

if __name__ == "__main__":
    # Konfiguriere Logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Führe die Validierung aus
    validate_all_tenant_classes() 