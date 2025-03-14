"""
Client-Modul für die Verbindung zu Weaviate.
Implementiert die Initialisierung und Konfiguration des Weaviate-Clients.
"""

import weaviate
import logging
from typing import Optional, Dict, Any
from ...core.config import settings

def get_weaviate_client():
    """Erstellt und gibt eine Singleton-Instanz des Weaviate-Clients zurück."""
    try:
        logging.info("Initialisiere Weaviate-Client...")
        
        # URL parsen (in v4 werden Host und Port separat benötigt)
        weaviate_url = settings.WEAVIATE_URL
        
        # Standard-Werte
        http_host = "weaviate"
        http_port = 8080
        http_secure = False
        
        # URL parsen
        if weaviate_url:
            # http(s)://host:port entfernen
            if "://" in weaviate_url:
                http_secure = weaviate_url.startswith("https")
                parts = weaviate_url.split("://")[1].split(":")
                http_host = parts[0]
                if len(parts) > 1:
                    try:
                        http_port = int(parts[1])
                    except ValueError:
                        pass
        
        # Bei Bedarf Header für Modellintegration
        headers = {}
        if settings.OPENAI_API_KEY:
            headers["X-OpenAI-Api-Key"] = settings.OPENAI_API_KEY
        
        # Auth-Konfiguration
        auth_credentials = None
        if settings.WEAVIATE_API_KEY:
            auth_credentials = weaviate.auth.AuthApiKey(api_key=settings.WEAVIATE_API_KEY)
        
        # Client mit connect_to_custom erstellen (basierend auf der Bibliotheksdokumentation)
        client = weaviate.connect_to_custom(
            http_host=http_host,
            http_port=http_port,
            http_secure=http_secure,
            grpc_host=http_host,
            grpc_port=50051,  # Standard-gRPC-Port
            grpc_secure=http_secure,
            headers=headers,
            auth_credentials=auth_credentials,
        )
        
        # Bereitschaft überprüfen
        try:
            if client.is_ready():
                logging.info("Weaviate-Client erfolgreich initialisiert")
                return client
            else:
                logging.error("Weaviate-Client nicht bereit")
                return None
        except Exception as e:
            logging.error(f"Weaviate-Client nicht bereit: {e}")
            return None
            
    except Exception as e:
        logging.error(f"Fehler bei der Weaviate-Client-Initialisierung: {e}")
        return None
        
# Singleton-Instanz
weaviate_client = get_weaviate_client() 