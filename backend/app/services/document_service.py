from typing import List, Optional
from sqlalchemy.orm import Session
from ..db.models import DocumentModel
from ..schemas.document import Document, DocumentCreate

class DocumentService:
    def get_document(self, db: Session, document_id: str) -> Optional[Document]:
        """Ein einzelnes Dokument abrufen"""
        db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
        if db_document:
            return Document.model_validate(db_document)
        return None

    def get_documents(self, db: Session, tenant_id: Optional[str] = None) -> List[Document]:
        """Alle Dokumente oder Dokumente eines bestimmten Tenants abrufen"""
        query = db.query(DocumentModel)
        if tenant_id:
            query = query.filter(DocumentModel.tenant_id == tenant_id)
        return [Document.model_validate(doc) for doc in query.all()]

    def create_document(self, db: Session, document: DocumentCreate, tenant_id: str) -> Document:
        """Ein neues Dokument erstellen"""
        db_document = DocumentModel(**document.model_dump(), tenant_id=tenant_id)
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return Document.model_validate(db_document)

    def delete_document(self, db: Session, document_id: str) -> bool:
        """Ein Dokument löschen"""
        db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
        if db_document:
            db.delete(db_document)
            db.commit()
            return True
        return False

# Singleton-Instanz
document_service = DocumentService() 