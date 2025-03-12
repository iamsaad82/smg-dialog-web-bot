"""
Weaviate-Service-Modul für die Interaktion mit der Weaviate-Vektordatenbank.
Dieses Modul dient als Kompatibilitätsschicht für die neue modulare Implementierung.
"""

from app.services.weaviate import WeaviateService, weaviate_service

# Exportiere die Singleton-Instanz für Abwärtskompatibilität
__all__ = ["WeaviateService", "weaviate_service"] 