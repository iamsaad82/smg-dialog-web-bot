"""
Search-Manager-Modul für die Suche in Weaviate.
"""

import logging
import json
from typing import Dict, Any, Optional, List, Tuple
import weaviate
import weaviate.classes as wvc
from ...core.config import settings
from .client import weaviate_client, connect_to_local
from .schema_manager import SchemaManager

# Konstanten für strukturierte Daten
STRUCTURED_CLASS_PREFIX = "StructuredData"

# Suchkonfiguration
SEARCH_CONFIG = {
    "vector_certainty": 0.3,    # Niedrigerer Schwellwert für semantische Ähnlichkeit
    "hybrid_certainty": 0.2,    # Niedrigerer Schwellwert für Hybrid-Fallback
    "hybrid_alpha": 0.1         # Noch stärkerer Fokus auf semantische Ähnlichkeit
}

class SearchManager:
    """Manager für die Suche in Weaviate."""
    
    @classmethod
    def _get_tenant_classes(cls, tenant_id: str) -> List[str]:
        """Ermittelt alle verfügbaren Klassen für einen Tenant."""
        try:
            client = connect_to_local()
            collection_names = client.collections.list_all()
            
            print(f"\nSuche Klassen für Tenant {tenant_id}")
            print(f"Tenant-ID ohne Bindestriche: {tenant_id.replace('-', '')}")
            
            # Alle Klassen für den Tenant filtern
            tenant_classes = []
            structured_classes = []
            other_classes = []
            
            print("\nVerfügbare Klassen im Schema:")
            for class_name in collection_names:
                print(f"- {class_name}")
                if tenant_id.replace("-", "") in class_name:
                    print(f"  -> Gehört zu Tenant {tenant_id}")
                    if class_name.startswith(STRUCTURED_CLASS_PREFIX):
                        structured_classes.append(class_name)
                        print(f"  -> Als strukturierte Daten erkannt")
                    else:
                        other_classes.append(class_name)
                        print(f"  -> Als andere Klasse erkannt")
            
            # Strukturierte Daten zuerst, dann andere
            tenant_classes = structured_classes + other_classes
            
            if not tenant_classes:
                print(f"Keine Klassen gefunden für Tenant {tenant_id}")
            else:
                print(f"\nGefundene Klassen für Tenant {tenant_id}:")
                print("Strukturierte Daten:", ", ".join(structured_classes) if structured_classes else "Keine")
                print("Andere Klassen:", ", ".join(other_classes) if other_classes else "Keine")
            
            return tenant_classes
            
        except Exception as e:
            print(f"Fehler beim Abrufen der Klassen: {str(e)}")
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

    @classmethod
    def search(
        cls,
        tenant_id: str, 
        query: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Führt eine Hybrid-Suche über alle Klassen des Mandanten durch.
        """
        all_results = []
        tenant_classes = cls._get_tenant_classes(tenant_id)
        logging.info(f"Durchsuche {len(tenant_classes)} Klassen für Tenant {tenant_id} mit Query: '{query}'")
        
        for class_name in tenant_classes:
            try:
                logging.info(f"Suche in Klasse: {class_name}")
                
                # Hole die Collection
                collection = weaviate_client.collections.get(class_name)
                
                # Führe die Hybrid-Suche durch
                logging.info("Führe Hybrid-Suche durch...")
                results = collection.query.hybrid(
                    query=query,
                    alpha=0.75,
                    limit=limit
                )
                
                # Extrahiere die Objekte aus den Ergebnissen
                objects = results.objects if hasattr(results, 'objects') else []
                logging.info(f"Hybrid-Suche gefunden: {len(objects)} Ergebnisse")
                
                formatted_results = []
                for obj in objects:
                    if not obj or not hasattr(obj, 'properties'):
                        continue
                        
                    properties = obj.properties
                    if not properties:
                        continue
                        
                    title = properties.get('title', 'Kein Titel')
                    content = properties.get('content', '')
                    
                    # Extrahiere die erste Zeile des Contents für die Vorschau
                    content_preview = content.split('\n')[0] if content else ''
                    
                    # Score extrahieren (falls vorhanden)
                    score = None
                    if hasattr(obj, 'score'):
                        score = obj.score
                    elif hasattr(obj, 'certainty'):
                        score = obj.certainty
                    elif hasattr(obj, 'distance'):
                        # Bei distance: kleinere Werte sind besser, also invertieren wir
                        score = 1.0 - obj.distance if obj.distance <= 1.0 else 0.0
                    
                    formatted_result = {
                        'title': title,
                        'content_preview': content_preview[:100] + '...' if len(content_preview) > 100 else content_preview,
                        'content': content,
                        'class_name': class_name,
                        'score': score
                    }
                    formatted_results.append(formatted_result)
                
                if formatted_results:
                    logging.info(f"Gefundene Ergebnisse in {class_name}:")
                    for i, result in enumerate(formatted_results):
                        logging.info(f"[{i+1}] {result['title']} (Score: {result['score']})")
                        logging.info(f"    Vorschau: {result['content_preview']}")
                    
                    all_results.extend(formatted_results)
                    logging.info(f"Insgesamt {len(formatted_results)} Ergebnisse in {class_name} gefunden")
                else:
                    logging.info(f"Keine relevanten Ergebnisse in {class_name} gefunden")
                
            except Exception as e:
                logging.error(f"Fehler bei der Suche in {class_name}: {str(e)}")
                continue
        
        # Sortiere alle Ergebnisse nach Score (wenn vorhanden)
        all_results.sort(key=lambda x: x.get('score', 0) if x.get('score') is not None else 0, reverse=True)
        
        logging.info(f"Gesamt: {len(all_results)} Ergebnisse gefunden")
        if all_results:
            logging.info(f"Top-Ergebnis: {all_results[0]['title']} (Score: {all_results[0]['score']})")
        else:
            logging.warning("Keine Suchergebnisse gefunden!")
            
        return all_results 