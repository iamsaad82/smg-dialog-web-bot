#!/usr/bin/env python

import sys
from app.services.structured_data_service import structured_data_service, StructuredDataService
from app.services.weaviate.client import weaviate_client
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def clear_existing_structured_data(tenant_id):
    """
    Löscht alle existierenden strukturierten Daten für einen Tenant.
    
    Args:
        tenant_id: ID des Tenants
        
    Returns:
        bool: True bei Erfolg, False bei Fehler
    """
    logger.info(f"Beginne Löschung existierender strukturierter Daten für Tenant {tenant_id}")
    
    try:
        if not weaviate_client:
            logger.error("Weaviate-Client konnte nicht initialisiert werden")
            return False
        
        deleted_count = 0
        
        # Für jeden unterstützten Datentyp die entsprechende Klasse löschen oder zurücksetzen
        for data_type in StructuredDataService.SUPPORTED_TYPES:
            class_name = StructuredDataService.get_class_name(tenant_id, data_type)
            
            try:
                # Prüfen, ob die Klasse existiert
                if weaviate_client.collections.exists(class_name):
                    # Sammlung abrufen
                    collection = weaviate_client.collections.get(class_name)
                    
                    # Objektanzahl ermitteln
                    try:
                        object_count = collection.query.fetch_objects(limit=1, include_vector=False)
                        has_objects = object_count and len(object_count.objects) > 0
                    except Exception as e:
                        logger.error(f"Fehler beim Prüfen der Objektanzahl: {str(e)}")
                        has_objects = False
                    
                    # Nur löschen, wenn Objekte existieren
                    if has_objects:
                        try:
                            # Alle Objekte löschen
                            deleted = collection.data.delete_many(
                                where={"path": ["id"], "operator": "LessThanEqual", "valueString": "ffffffff-ffff-ffff-ffff-ffffffffffff"}
                            )
                            deleted_count += deleted
                            logger.info(f"Gelöschte Objekte in {class_name}: {deleted}")
                        except Exception as e:
                            logger.error(f"Fehler beim Löschen der Objekte in {class_name}: {str(e)}")
                    else:
                        logger.info(f"Keine Objekte in {class_name} vorhanden")
                else:
                    logger.info(f"Klasse {class_name} existiert nicht, keine Löschung erforderlich")
            except Exception as e:
                logger.error(f"Fehler beim Löschen der Daten vom Typ {data_type}: {str(e)}")
        
        logger.info(f"Insgesamt {deleted_count} strukturierte Daten-Objekte gelöscht")
        return True
    except Exception as e:
        logger.error(f"Fehler beim Löschen existierender Daten: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Verwendung: python delete_structured_data.py <tenant_id>")
        sys.exit(1)
    
    tenant_id = sys.argv[1]
    print(f"Lösche alle strukturierten Daten für Tenant: {tenant_id}")
    success = clear_existing_structured_data(tenant_id)
    
    if success:
        print("Strukturierte Daten erfolgreich gelöscht")
    else:
        print("Fehler beim Löschen der strukturierten Daten")
        sys.exit(1) 