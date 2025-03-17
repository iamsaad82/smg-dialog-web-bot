"""
Search-Manager-Modul für die Suche in Weaviate.
"""

import logging
import json
from typing import Dict, Any, Optional, List, Tuple
import weaviate
from ...core.config import settings
from .client import get_client
from .schema_manager import SchemaManager

# Konstanten für strukturierte Daten
STRUCTURED_DATA_PREFIX = "StructuredData"

# Suchkonfiguration
SEARCH_CONFIG = {
    "hybrid": True, 
    "properties": ["content", "title"],
    "limit": 10
}

class SearchManager:
    """Manager für die Suche in Weaviate."""
    
    @staticmethod
    def _get_tenant_classes(tenant_id: str) -> List[str]:
        """
        Prüft ob Tenant-Klassen existieren, da Weaviate v4 keine direkte Methode zum Auflisten aller Collections bietet
        """
        tenant_class = f"Tenant{tenant_id}"
        structured_data_class = f"{STRUCTURED_DATA_PREFIX}{tenant_id}"
        
        classes = []
        client = get_client()
        
        try:
            # Prüfe ob die Tenant-Klasse existiert
            if SchemaManager.class_exists(tenant_class):
                classes.append(tenant_class)
                logging.info(f"Tenant-Klasse {tenant_class} gefunden")
            
            # Prüfe ob die StructuredData-Klasse existiert
            if SchemaManager.class_exists(structured_data_class):
                classes.append(structured_data_class)
                logging.info(f"StructuredData-Klasse {structured_data_class} gefunden")
                
            return classes
        except Exception as e:
            logging.error(f"Fehler beim Abrufen der Tenant-Klassen: {str(e)}")
            return []
    
    @staticmethod
    def _get_property_value(properties: Dict[str, Any], field_keys: List[str]) -> str:
        """Helper-Methode um Werte aus Properties zu extrahieren."""
        for key in field_keys:
            if key in properties and properties[key]:
                return properties[key]
        return ""
    
    @staticmethod
    def _format_structured_content(properties: Dict[str, Any]) -> str:
        """Formatiert strukturierte Daten in lesbaren Content."""
        content_parts = []
        
        # Alle verfügbaren Properties durchgehen
        for key, value in properties.items():
            # Bestimmte technische Felder überspringen
            if key in ["vectorWeights", "fullTextSearch"]:
                continue
                
            if value and isinstance(value, str):
                # Feldname in lesbares Format umwandeln
                readable_key = key.replace('_', ' ').capitalize()
                content_parts.append(f"{readable_key}: {value}")
        
        return "\n".join(filter(None, content_parts))

    @staticmethod
    def search(tenant_id: str, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Führt eine Hybrid-Suche über alle Klassen eines Tenants durch
        """
        client = get_client()
        tenant_classes = SearchManager._get_tenant_classes(tenant_id)
        
        if not tenant_classes:
            logging.warning(f"Keine Tenant-Klassen für Tenant {tenant_id} gefunden")
            return []
        
        results = []
        
        try:
            for class_name in tenant_classes:
                logging.info(f"Suche in Klasse {class_name} nach '{query}'")
                
                # Hybrid-Suche mit der v4 API durchführen
                collection = client.collections.get(class_name)
                
                # Angepasste Hybrid-Suche für Weaviate v4
                # properties auflisten, die zurückgegeben werden sollen
                properties = ["content", "title", "document_id", "chunk_id", "metadata"]
                
                # In v4 wird die Query direkt ausgeführt ohne do()
                response = collection.query.hybrid(
                    query=query,
                    limit=limit,
                    properties=properties,
                    include_vector=True
                )
                
                if response.objects:
                    logging.info(f"{len(response.objects)} Ergebnisse in {class_name} gefunden")
                    for obj in response.objects:
                        # Konvertiere die Antwort in das erwartete Format
                        item = {
                            "class": class_name,
                            "id": obj.uuid,
                            "score": getattr(obj, "score", 0),
                            "properties": obj.properties
                        }
                        results.append(item)
                else:
                    logging.info(f"Keine Ergebnisse in {class_name} gefunden")
            
            # Sortiere Ergebnisse nach Score (absteigend)
            results.sort(key=lambda x: x.get("score", 0), reverse=True)
            return results[:limit]
            
        except Exception as e:
            logging.error(f"Fehler bei der Suche über Tenant {tenant_id}: {str(e)}")
            return [] 