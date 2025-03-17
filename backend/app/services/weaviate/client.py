"""
Weaviate Client für die Verbindung zur Weaviate-Instanz

Dieses Modul stellt eine Verbindung zu einer lokalen Weaviate-Instanz her,
konfiguriert die Timeout-Einstellungen für eine zuverlässige Verbindung und
stellt eine Singleton-Instanz des Clients zur Verfügung.
"""

import logging
import weaviate
import atexit
from weaviate.config import AdditionalConfig, Timeout
# ConnectionParams wird in Weaviate v4 nicht mehr genutzt
from weaviate.exceptions import WeaviateConnectionError

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Client-Instanz (Singleton)
_client = None

def get_client():
    """
    Gibt eine Singleton-Instanz des Weaviate-Clients zurück.
    Erstellt einen neuen Client, falls noch keiner existiert.
    """
    global _client
    if _client is None:
        _client = init_client()
    return _client

def close_client():
    """
    Schließt die Weaviate-Client-Verbindung ordnungsgemäß.
    Diese Funktion sollte aufgerufen werden, wenn die Anwendung heruntergefahren wird.
    """
    global _client
    if _client is not None:
        try:
            logger.info("Schließe Weaviate-Client-Verbindung...")
            _client.close()
            logger.info("Weaviate-Client-Verbindung erfolgreich geschlossen")
            _client = None
        except Exception as e:
            logger.error(f"Fehler beim Schließen der Weaviate-Client-Verbindung: {str(e)}")

def init_client():
    """
    Initialisiert einen neuen Weaviate-Client mit angepassten Timeout-Einstellungen.
    """
    try:
        # Timeout-Konfiguration für zuverlässige Verbindungen
        # Erhöhte Timeouts für Operationen mit vielen Dokumenten
        timeout_config = Timeout(
            connect=30.0,     # 30 Sekunden für die initiale Verbindung
            query=120.0,      # 120 Sekunden für Abfragen (erhöht für komplexe Queries)
            insert=180.0,     # 180 Sekunden für Einfügeoperationen (erhöht für Batch-Operationen)
            startup=60.0      # 60 Sekunden für Startup-Operationen
        )
        
        # Verbindung zu lokaler Weaviate-Instanz herstellen
        client = weaviate.connect_to_local(
            host="weaviate", 
            port=8080,
            grpc_port=50051,
            additional_config=AdditionalConfig(
                timeout=timeout_config
            )
        )
        
        # Verbindung testen und Version überprüfen
        try:
            meta = client.get_meta()
            version = meta.get('version', 'unbekannt')
            logger.info(f"Weaviate-Client erfolgreich initialisiert, Version: {version}")
        except Exception as meta_error:
            logger.warning(f"Konnte Meta-Informationen nicht abrufen: {str(meta_error)}")
            logger.info("Weaviate-Client wurde initialisiert, aber Meta-Informationen konnten nicht abgerufen werden")
        
        # Bei Programmende sicherstellen, dass die Verbindung geschlossen wird
        atexit.register(close_client)
        
        return client
        
    except WeaviateConnectionError as conn_error:
        logger.error(f"Verbindungsfehler zum Weaviate-Server: {str(conn_error)}")
        logger.info("Stellen Sie sicher, dass der Weaviate-Server läuft und erreichbar ist")
        return None
    except Exception as e:
        logger.error(f"Fehler bei der Initialisierung des Weaviate-Clients: {str(e)}")
        return None

# Initialisiere Client beim Import dieses Moduls
try:
    _client = init_client()
    if _client:
        logger.info("Weaviate-Client-Singleton initialisiert")
    else:
        logger.warning("Weaviate-Client konnte nicht initialisiert werden, wird bei Bedarf erneut versucht")
except Exception as e:
    logger.error(f"Fehler beim Initialisieren des Weaviate-Client-Singletons: {str(e)}")
    _client = None 