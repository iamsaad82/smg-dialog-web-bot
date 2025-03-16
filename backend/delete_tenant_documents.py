#!/usr/bin/env python

import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.models import DocumentModel
from app.services.weaviate_service import weaviate_service
from app.db.session import get_db
from app.core.config import settings

def delete_all_documents_for_tenant(tenant_id):
    """
    Löscht alle Dokumente für einen bestimmten Tenant sowohl aus PostgreSQL als auch aus Weaviate.
    
    Args:
        tenant_id: ID des Tenants, dessen Dokumente gelöscht werden sollen
    """
    # PostgreSQL-Verbindung aus der Session holen (wie im rest der App)
    try:
        # Session Generator nutzen
        db_generator = get_db()
        db = next(db_generator)
        
        # Alle Dokumente des Tenants aus der PostgreSQL-Datenbank abrufen
        documents = db.query(DocumentModel).filter(
            DocumentModel.tenant_id == tenant_id
        ).all()
        
        if not documents:
            print(f"Keine Dokumente für Tenant {tenant_id} gefunden.")
            return
        
        print(f"Gefunden: {len(documents)} Dokumente für Tenant {tenant_id}")
        
        # Jedes Dokument löschen (zuerst aus Weaviate, dann aus PostgreSQL)
        for doc in documents:
            doc_id = doc.id
            print(f"Lösche Dokument {doc_id} ({doc.title})...")
            
            # Aus Weaviate löschen
            weaviate_success = weaviate_service.delete_document(
                tenant_id=tenant_id,
                doc_id=doc_id
            )
            
            if weaviate_success:
                print(f"  ✓ Aus Weaviate gelöscht")
            else:
                print(f"  ✗ Fehler beim Löschen aus Weaviate")
            
            # Aus PostgreSQL löschen
            db.delete(doc)
        
        # Änderungen speichern
        db.commit()
        print(f"Alle {len(documents)} Dokumente erfolgreich gelöscht.")
        
    except Exception as e:
        print(f"Fehler beim Löschen der Dokumente: {e}")
        import traceback
        print(traceback.format_exc())
        try:
            db.rollback()
        except:
            pass
    finally:
        try:
            db.close()
        except:
            pass

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Verwendung: python delete_tenant_documents.py <tenant_id>")
        sys.exit(1)
    
    tenant_id = sys.argv[1]
    print(f"Lösche alle Dokumente für Tenant: {tenant_id}")
    delete_all_documents_for_tenant(tenant_id) 