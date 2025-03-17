import weaviate
from weaviate.collections.classes.config import DataType, Property, VectorizerConfig
import logging

# Logging konfigurieren
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def main():
    # Verbindung zu lokaler Weaviate-Instanz herstellen
    client = weaviate.connect_to_local(
        host="weaviate",
        port=8080,
        grpc_port=50051
    )
    
    logger.info("Weaviate-Client erfolgreich initialisiert")
    
    # Schema abrufen
    schema = client.collections.list_all()
    logger.info(f"Aktuelle Klassen in Weaviate: {[c.name for c in schema]}")
    
    # Test-Klasse erstellen
    test_class_name = "TestClass"
    logger.info(f"Versuche, Klasse {test_class_name} zu erstellen...")
    
    try:
        # Prüfen, ob die Klasse bereits existiert
        try:
            existing = client.collections.get(test_class_name)
            logger.info(f"Klasse {test_class_name} existiert bereits: {existing}")
            client.collections.delete(test_class_name)
            logger.info(f"Klasse {test_class_name} gelöscht")
        except Exception as e:
            logger.info(f"Klasse {test_class_name} existiert nicht: {e}")
        
        # Erstelle die Klasse
        test_collection = client.collections.create(
            name=test_class_name,
            vectorizer_config=VectorizerConfig(
                vectorizer="text2vec-transformers",
                model="text2vec-transformers",
                vectorize_collection_name=False
            ),
            properties=[
                Property(
                    name="title",
                    data_type=DataType.TEXT
                ),
                Property(
                    name="content",
                    data_type=DataType.TEXT
                )
            ]
        )
        logger.info(f"Klasse {test_class_name} erfolgreich erstellt: {test_collection}")
        
        # Schema erneut abrufen, um zu überprüfen, ob die Klasse erstellt wurde
        schema = client.collections.list_all()
        logger.info(f"Aktualisierte Klassen in Weaviate: {[c.name for c in schema]}")
    
    except Exception as e:
        logger.error(f"Fehler beim Erstellen der Klasse: {e}")
    
    finally:
        client.close()
        logger.info("Weaviate-Client-Verbindung geschlossen")

if __name__ == "__main__":
    main() 