"""
Client-Modul für die Verbindung zu Weaviate.
Implementiert die Initialisierung und Konfiguration des Weaviate-Clients.
"""

import weaviate
import logging
from typing import Optional, Dict, Any
from weaviate.classes.init import AdditionalConfig, Timeout, Auth
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
                host_port = weaviate_url.split("://")[1]
            else:
                host_port = weaviate_url
                
            # Host und Port trennen
            if ":" in host_port:
                parts = host_port.split(":")
                http_host = parts[0]
                http_port = int(parts[1])
            else:
                http_host = host_port
        
        # Zusätzliche Header (z.B. für OpenAI)
        headers = {}
        if settings.OPENAI_API_KEY:
            headers["X-OpenAI-Api-Key"] = settings.OPENAI_API_KEY
        
        # Auth-Konfiguration
        auth_config = None
        if settings.WEAVIATE_API_KEY:
            auth_config = Auth.api_key(settings.WEAVIATE_API_KEY)
        
        # Client mit verbesserten Timeout-Einstellungen erstellen
        client = weaviate.connect_to_custom(
            http_host=http_host,
            http_port=http_port,
            http_secure=http_secure,
            grpc_host=http_host,
            grpc_port=grpc_port,
            grpc_secure=http_secure,
            headers=headers,
            auth_credentials=auth_config,
            additional_config=AdditionalConfig(
                timeout=Timeout(init=30, query=60, insert=120)  # Längere Timeouts für Stabilität
            )
        )
        
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