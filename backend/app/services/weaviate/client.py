"""
Client-Modul für die Verbindung zu Weaviate.
Implementiert die Initialisierung und Konfiguration des Weaviate-Clients.
"""

import weaviate
import logging
from typing import Optional, Dict, Any
from weaviate.classes.config import ConnectionConfig
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
        
        # Verbindungskonfiguration für v4
        connection_params = weaviate.connect.ConnectionParams.with_http(
            url=weaviate_url or f"{'https' if http_secure else 'http'}://{http_host}:{http_port}",
        )
        
        # Auth-Konfiguration
        if settings.WEAVIATE_API_KEY:
            connection_params = connection_params.with_api_key(settings.WEAVIATE_API_KEY)
            
        # Client mit verbesserten Timeout-Einstellungen erstellen (v4)
        client = weaviate.WeaviateClient(
            connection_params=connection_params,
            additional_config=weaviate.classes.init.AdditionalConfig(
                timeout=weaviate.classes.init.Timeout(init=30, query=60)
            )
        )
        
        # Bei Bedarf Header für Modellintegration hinzufügen
        if settings.OPENAI_API_KEY:
            client.configure_additional_headers({
                "X-OpenAI-Api-Key": settings.OPENAI_API_KEY
            })
        
        # Bereitschaft überprüfen
        # In v4 gibt es keine direkte is_ready()-Methode, stattdessen verwenden wir die Schemaabfrage
        try:
            client.schema.get()
            logging.info("Weaviate-Client erfolgreich initialisiert")
            return client
        except Exception as e:
            logging.error(f"Weaviate-Client nicht bereit: {e}")
            return None
            
    except Exception as e:
        logging.error(f"Fehler bei der Weaviate-Client-Initialisierung: {e}")
        return None
        
# Singleton-Instanz
weaviate_client = get_weaviate_client() 