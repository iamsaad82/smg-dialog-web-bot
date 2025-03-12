#!/usr/bin/env python3
"""
Skript zum Import aller Dokumente aus der Datenbank in den Weaviate-Index
"""

import asyncio
from app.db.session import get_db
from app.services.weaviate_service import weaviate_service
from sqlalchemy import text
from app.schemas.document import Document


async def import_documents_for_tenant(tenant_id: str):
    """Importiert alle Dokumente eines Tenants in Weaviate"""
    print(f"\nImportiere Dokumente für Tenant {tenant_id}...")
    
    # DB-Session holen
    db = next(get_db())
    
    try:
        # Alle Dokumente des Tenants abrufen
        result = db.execute(
            text(f"SELECT * FROM documents WHERE tenant_id = '{tenant_id}'")
        )
        documents = result.fetchall()
        
        print(f"Gefundene Dokumente in der Datenbank: {len(documents)}")
        
        if not documents:
            print("Keine Dokumente zum Importieren gefunden.")
            return
        
        # Schema für den Tenant erstellen, falls es noch nicht existiert
        if not weaviate_service.tenant_class_exists(tenant_id):
            print(f"Schema für Tenant {tenant_id} existiert nicht. Erstelle es...")
            weaviate_service.create_tenant_schema(tenant_id)
        else:
            print(f"Schema für Tenant {tenant_id} existiert bereits.")
        
        # Sicherstellen, dass die Tenant-Klasse valide ist
        print("Validiere Tenant-Klasse...")
        class_valid = await weaviate_service.validate_tenant_class(tenant_id)
        if not class_valid:
            print("⚠️ Warnung: Tenant-Klasse konnte nicht validiert werden. Der Import könnte fehlschlagen.")
        
        # Dokumente importieren
        imported_count = 0
        error_count = 0
        
        # Konvertiere SQLAlchemy-Row-Objekte in Document-Objekte für Reindexierung
        document_list = []
        for doc in documents:
            document_obj = Document(
                id=doc.id,
                tenant_id=doc.tenant_id,
                title=doc.title,
                content=doc.content,
                source=doc.source,
                doc_metadata=doc.doc_metadata,
                created_at=doc.created_at
            )
            document_list.append(document_obj)
        
        # Neuindizierung aller Dokumente über den Health-Manager
        print(f"Starte Neuindizierung von {len(document_list)} Dokumenten...")
        total, success = await weaviate_service.reindex_all_documents(tenant_id, document_list)
        
        print(f"\nImport abgeschlossen:")
        print(f"  Dokumente gesamt: {total}")
        print(f"  Erfolgreich importiert: {success}")
        print(f"  Fehler: {total - success}")
        
        # Prüfen, wie viele Dokumente jetzt in Weaviate sind
        docs_in_weaviate = weaviate_service.get_documents(tenant_id)
        print(f"  Dokumente in Weaviate nach Import: {len(docs_in_weaviate)}")
        
    except Exception as e:
        print(f"Fehler beim Import der Dokumente: {str(e)}")
    finally:
        db.close()


async def main():
    """Hauptfunktion zum Ausführen des Skripts"""
    print("Starte Import von Dokumenten in Weaviate...")
    
    # Tenant-ID für die AOK
    tenant_id = "3622a3a8-b6b1-4c93-80e9-b4ac0b31cb5b"
    
    await import_documents_for_tenant(tenant_id)
    
    print("\nImport abgeschlossen!")


if __name__ == "__main__":
    asyncio.run(main()) 