import logging
import sys
from pathlib import Path
import os

# Logger-Konfiguration
def setup_logger():
    """
    Richtet den Logger für die Anwendung ein.
    """
    # Basis-Logging-Konfiguration
    log_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Log-Verzeichnis erstellen, falls es nicht existiert
    log_dir = Path(__file__).parent.parent.parent / "logs"
    log_dir.mkdir(exist_ok=True)
    
    # Datei-Handler für detaillierte Logs
    file_handler = logging.FileHandler(log_dir / "app.log")
    file_handler.setFormatter(logging.Formatter(log_format))
    
    # Root-Logger konfigurieren
    root_logger = logging.getLogger()
    root_logger.addHandler(file_handler)
    
    # Logger für unsere Anwendung
    app_logger = logging.getLogger("app")
    app_logger.setLevel(logging.INFO)
    
    # In Produktionsumgebung Error-Level verwenden
    if os.getenv("ENV", "development") == "production":
        app_logger.setLevel(logging.ERROR)
    
    return app_logger

# Logger-Instanz erstellen
logger = setup_logger() 