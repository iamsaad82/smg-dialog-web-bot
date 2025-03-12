from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from app.models.weaviate_status import IndexStatus

class DocumentBase(BaseModel):
    """Basis-Schema für Dokumente"""
    title: str
    content: str
    source: Optional[str] = None
    doc_metadata: Optional[Dict[str, Any]] = None

class DocumentCreate(DocumentBase):
    """Schema für die Erstellung eines Dokuments"""
    pass

class Document(DocumentBase):
    """Schema für ein Dokument mit zusätzlichen Datenbankfeldern"""
    id: str
    tenant_id: str
    created_at: datetime

    class Config:
        from_attributes = True
        populate_by_name = True

class WeaviateStatus(BaseModel):
    """Schema für den Weaviate-Status eines Dokuments"""
    status: IndexStatus
    lastUpdated: Optional[str] = None
    error: Optional[str] = None  # Fehlerinformationen, falls vorhanden 