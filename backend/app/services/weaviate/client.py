"""
Client-Modul für die Verbindung zu Weaviate.
Implementiert die Initialisierung und Konfiguration des Weaviate-Clients.
"""

import weaviate
import logging
from typing import Optional, Dict, Any
from ...core.config import settings
from weaviate.classes.init import AdditionalConfig, Timeout

def connect_to_local() -> weaviate.WeaviateClient:
    """Verbindet mit einer lokalen Weaviate-Instanz."""
    try:
        client = weaviate.connect_to_local(
            host="weaviate",  # Docker-Container-Name
            port=8080,
            grpc_port=50051,
            additional_config=AdditionalConfig(
                timeout=Timeout(init=30, query=60, insert=120)
            )
        )
        logging.info("Weaviate-Client erfolgreich initialisiert")
        return client
    except Exception as e:
        logging.error(f"Fehler bei der Weaviate-Client-Initialisierung: {str(e)}")
        raise

# Singleton-Instanz
weaviate_client = connect_to_local()

if weaviate_client is None:
    logging.error("Weaviate-Client konnte nicht initialisiert werden")
else:
    logging.info("Weaviate-Client erfolgreich als Singleton initialisiert") 