"""
Search-Manager-Modul für die Suche in Weaviate.
"""

import logging
import json
from typing import Dict, Any, Optional, List
import weaviate
import weaviate.classes as wvc
from .client import weaviate_client
from .schema_manager import SchemaManager

class SearchManager:
    """Manager für die Suche in Weaviate."""
    
    @staticmethod
    def search(
        tenant_id: str, 
        query: str, 
        limit: int = 5, 
        hybrid_search: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Führt eine semantische Suche in der Wissensbasis eines Tenants durch.
        Unterstützt hybride Suche (Vektor + Schlüsselwörter).
        """
        if not weaviate_client:
            logging.error("Weaviate-Client ist nicht initialisiert")
            return []
            
        class_name = SchemaManager.get_tenant_class_name(tenant_id)
        
        # Prüfen, ob Klasse existiert
        if not SchemaManager.class_exists(class_name):
            logging.warning(f"Klasse {class_name} existiert nicht")
            return []
        
        print(f"Weaviate search: Suche mit Query '{query}' für Tenant {tenant_id} (Hybrid: {hybrid_search})")
        print(f"Verwende Weaviate-Klasse: {class_name}")
        
        # Query optimieren
        # Wörter mit einer Länge unter 3 entfernen und Stoppwörter filtern
        query_words = query.split()
        filtered_query_words = [word for word in query_words if len(word) >= 3]
        
        # Falls die gefilterte Abfrage leer ist, verwenden wir die ursprüngliche
        filtered_query = " ".join(filtered_query_words) if filtered_query_words else query
        print(f"Optimierte Query: '{filtered_query}'")
        
        try:
            # Collection abrufen
            collection = weaviate_client.collections.get(class_name)
            
            # Abfrage vorbereiten
            if hybrid_search:
                # Hybride Suche mit BM25 und Vektorsuche
                print(f"Verwende hybride Suche mit Alpha=0.75 (höhere Gewichtung für Schlüsselwörter)")
                
                # In v4 wird die hybride Suche anders konfiguriert
                query_obj = collection.query.hybrid(
                    query=filtered_query,
                    alpha=0.75,  # Balance zwischen Vektor (0) und Keyword (1)
                    limit=limit
                )
            else:
                # Nur Vektorsuche
                print(f"Verwende reine Vektorsuche")
                query_obj = collection.query.near_text(
                    query=filtered_query,
                    limit=limit
                )
            
            # Abfrage ausführen
            print(f"Führe Weaviate-Abfrage aus für Query: '{filtered_query}'...")
            response = query_obj.objects
            print(f"Weaviate-Ergebnisse erhalten: {response is not None}")
            
            # Ergebnisse formatieren
            if not response:
                print(f"WARNUNG: Keine Ergebnisse gefunden oder ungültiges Antwortformat")
                
                # Zweiter Versuch mit geringerem Alpha-Wert (mehr Vektor-Gewichtung)
                if hybrid_search:
                    print("Zweiter Versuch mit Alpha=0.5 (ausgewogenere Gewichtung)")
                    query_obj = collection.query.hybrid(
                        query=filtered_query,
                        alpha=0.5,
                        limit=limit
                    )
                    response = query_obj.objects
                    
                    if not response:
                        print(f"WARNUNG: Auch im zweiten Versuch keine Ergebnisse gefunden")
                        return []
            
            # Dokumente nach Relevanz sortieren
            documents = []
            for obj in response:
                doc = {
                    "id": str(obj.uuid),
                    "title": obj.properties.get("title", ""),
                    "content": obj.properties.get("content", ""),
                    "source": obj.properties.get("source", ""),
                    "certainty": obj.metadata.certainty if hasattr(obj.metadata, "certainty") else 0
                }
                
                # Metadaten aus JSON-String zurück in Objekt konvertieren
                metadata_str = obj.properties.get("metadata", "{}")
                try:
                    doc["metadata"] = json.loads(metadata_str)
                except:
                    doc["metadata"] = {}
                
                documents.append(doc)
            
            # Nach Relevanz sortieren, nur wenn certainty-Werte vorhanden sind
            if documents and all(doc.get("certainty") is not None for doc in documents):
                documents.sort(key=lambda x: x.get("certainty", 0), reverse=True)
            
            print(f"Gefundene Dokumente: {len(documents)}")
            if documents:
                print(f"Bestes Match: {documents[0].get('title', 'Kein Titel')}")
            
            return documents
            
        except Exception as e:
            print(f"FEHLER bei Weaviate-Suche: {str(e)}")
            logging.error(f"Fehler bei der Suche: {e}")
            return [] 