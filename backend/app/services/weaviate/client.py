"""
Client-Modul für die Verbindung zu Weaviate.
Implementiert die Initialisierung und Konfiguration des Weaviate-Clients.
"""

import weaviate
import logging
from typing import Optional, Dict, Any
# Aktualisierter Import für Weaviate 3.x
# from weaviate.classes.init import AdditionalConfig, Timeout, Auth
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
        grpc_port = 50051
        
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
        
        # Auth-Konfiguration
        auth_config = None
        if settings.WEAVIATE_API_KEY:
            # Bei Weaviate 3.x verwenden wir direkt die AuthApiKey-Klasse
            auth_config = weaviate.auth.AuthApiKey(api_key=settings.WEAVIATE_API_KEY)
            
        # Client mit verbesserten Timeout-Einstellungen erstellen
        client = weaviate.Client(
            url=weaviate_url or f"{'https' if http_secure else 'http'}://{http_host}:{http_port}",
            auth_client_secret=auth_config,
            timeout_config=(30, 60, 120)  # in Version 3.x werden Timeouts direkt als Tuple (init, query, insert) übergeben
        )
        
        # Bei Bedarf Header für Modellintegration hinzufügen
        if settings.OPENAI_API_KEY:
            client.configure_additional_headers({
                "X-OpenAI-Api-Key": settings.OPENAI_API_KEY
            })
        
        # Bereitschaft überprüfen
        if client.is_ready():
            logging.info("Weaviate-Client erfolgreich initialisiert")
            return client
        else:
            logging.error("Weaviate-Client nicht bereit")
            return None
            
    except Exception as e:
        logging.error(f"Fehler bei der Weaviate-Client-Initialisierung: {e}")
        return None
        
# Singleton-Instanz
weaviate_client = get_weaviate_client() 