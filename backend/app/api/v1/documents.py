from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional
from pydantic import parse_obj_as
import json
import pandas as pd
import io
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ...db.models import Document, DocumentCreate, DocumentModel
from ...services.weaviate_service import weaviate_service
from ...core.security import get_tenant_id_from_api_key
from ...db.session import get_db
from ...services import document_service
from ...schemas.document import WeaviateStatus
from ...core.auth import get_api_key

router = APIRouter()


@router.post("/", response_model=Document, status_code=status.HTTP_201_CREATED)
async def create_document(
    document: DocumentCreate,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """Fügt ein neues Dokument zur Wissensbasis hinzu."""
    # Weaviate-Dokument erstellen
    doc_id = weaviate_service.add_document(
        tenant_id=tenant_id,
        title=document.title,
        content=document.content,
        metadata=document.doc_metadata,
        source=document.source
    )
    
    # Datenbank-Dokument erstellen
    db_document = DocumentModel(
        id=doc_id,
        tenant_id=tenant_id,
        title=document.title,
        content=document.content,
        doc_metadata=document.doc_metadata,
        source=document.source
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    return Document.model_validate(db_document)


@router.options("/", include_in_schema=False)
@router.options("/{document_id}", include_in_schema=False)
@router.options("/upload/csv", include_in_schema=False)
@router.options("/upload/json", include_in_schema=False)
async def options_documents():
    """Handler für OPTIONS-Anfragen an Documents-Endpunkte."""
    return {}


@router.get("/", response_model=List[Document])
async def get_documents(
    tenant_id: str,
    limit: int = 1000,
    offset: int = 0,
    api_key: str = Depends(get_api_key),
    db: Session = Depends(get_db)
):
    """Ruft alle Dokumente eines Tenants ab."""
    try:
        print(f"Suche Dokumente für Tenant: {tenant_id}")
        # Dokumente aus der Datenbank abrufen
        db_documents = db.query(DocumentModel).filter(
            DocumentModel.tenant_id == tenant_id
        ).offset(offset).limit(limit).all()
        
        print(f"Gefundene Dokumente: {len(db_documents)}")
        for doc in db_documents:
            print(f"Dokument: ID={doc.id}, Titel={doc.title}, Created={doc.created_at}")
        
        result = [Document.model_validate(doc) for doc in db_documents]
        print(f"Serialisierte Dokumente: {len(result)}")
        return result
    except Exception as e:
        print(f"Fehler beim Abrufen der Dokumente: {e}")
        import traceback
        print(traceback.format_exc())
        return []


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """Löscht ein Dokument aus der Wissensbasis."""
    # Dokument aus der Datenbank löschen
    db_document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.tenant_id == tenant_id
    ).first()
    
    if not db_document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokument nicht gefunden"
        )
    
    # Aus Weaviate löschen
    success = weaviate_service.delete_document(
        tenant_id=tenant_id,
        doc_id=document_id
    )
    
    if success:
        db.delete(db_document)
        db.commit()
    
    return None


@router.post("/upload/csv", status_code=status.HTTP_201_CREATED)
async def upload_csv(
    file: UploadFile = File(...),
    title_column: str = Form("title"),
    content_column: str = Form("content"),
    source_column: Optional[str] = Form(None),
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Lädt eine CSV-Datei hoch und fügt die Daten als Dokumente zur Wissensbasis hinzu.
    
    - Die CSV muss mindestens eine Spalte für Titel und Inhalt haben
    - Optional kann eine Spalte für die Quelle angegeben werden
    """
    try:
        # CSV-Datei lesen
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Prüfen, ob die erforderlichen Spalten vorhanden sind
        if title_column not in df.columns or content_column not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CSV muss die Spalten '{title_column}' und '{content_column}' enthalten"
            )
        
        # Dokumente hinzufügen
        added_docs = []
        for _, row in df.iterrows():
            title = row[title_column]
            content = row[content_column]
            source = row.get(source_column) if source_column and source_column in df.columns else None
            
            # Metadaten aus allen anderen Spalten erstellen
            metadata = {}
            for col in df.columns:
                if col not in [title_column, content_column, source_column]:
                    metadata[col] = row[col]
            
            # Dokument in Weaviate hinzufügen
            doc_id = weaviate_service.add_document(
                tenant_id=tenant_id,
                title=title,
                content=content,
                metadata=metadata,
                source=source
            )
            
            # Dokument in der Datenbank speichern
            db_document = DocumentModel(
                id=doc_id,
                tenant_id=tenant_id,
                title=title,
                content=content,
                doc_metadata=metadata,
                source=source
            )
            db.add(db_document)
            
            added_docs.append({
                "id": doc_id,
                "title": title
            })
        
        # Alle Dokumente in der Datenbank speichern
        db.commit()
        
        return {
            "message": f"{len(added_docs)} Dokumente erfolgreich hinzugefügt",
            "documents": added_docs
        }
    
    except Exception as e:
        db.rollback()  # Rollback bei Fehlern
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Verarbeiten der CSV-Datei: {str(e)}"
        )


@router.post("/upload/json", status_code=status.HTTP_201_CREATED)
async def upload_json(
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Lädt eine JSON-Datei hoch und fügt die Daten als Dokumente zur Wissensbasis hinzu.
    
    Die JSON-Datei sollte ein Array von Objekten mit mindestens "title" und "content" enthalten.
    Optional können "source" und "metadata" angegeben werden.
    """
    try:
        # JSON-Datei lesen
        contents = await file.read()
        data = json.loads(contents)
        
        if not isinstance(data, list):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="JSON muss ein Array von Objekten sein"
            )
        
        # Dokumente hinzufügen
        added_docs = []
        for item in data:
            # Als DocumentCreate parsen
            try:
                doc = parse_obj_as(DocumentCreate, item)
            except Exception:
                # Überprüfen, ob mindestens Titel und Inhalt vorhanden sind
                if "title" not in item or "content" not in item:
                    continue
                
                # Manuell ein Dokument erstellen
                doc = DocumentCreate(
                    title=item["title"],
                    content=item["content"],
                    source=item.get("source"),
                    doc_metadata=item.get("metadata", {})
                )
            
            # Dokument in Weaviate hinzufügen
            doc_id = weaviate_service.add_document(
                tenant_id=tenant_id,
                title=doc.title,
                content=doc.content,
                metadata=doc.doc_metadata,
                source=doc.source
            )
            
            # Dokument in der Datenbank speichern
            db_document = DocumentModel(
                id=doc_id,
                tenant_id=tenant_id,
                title=doc.title,
                content=doc.content,
                doc_metadata=doc.doc_metadata,
                source=doc.source
            )
            db.add(db_document)
            
            added_docs.append({
                "id": doc_id,
                "title": doc.title
            })
        
        # Alle Dokumente in der Datenbank speichern
        db.commit()
        
        return {
            "message": f"{len(added_docs)} Dokumente erfolgreich hinzugefügt",
            "documents": added_docs
        }
    
    except Exception as e:
        db.rollback()  # Rollback bei Fehlern
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Verarbeiten der JSON-Datei: {str(e)}"
        )


@router.post("/upload/markdown", status_code=status.HTTP_201_CREATED)
async def upload_markdown(
    file: UploadFile = File(...),
    source: Optional[str] = Form(None),
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Lädt eine Markdown-Datei hoch und fügt sie als Dokument zur Wissensbasis hinzu.
    Der Dateiname wird als Titel verwendet, der Inhalt als Content.
    """
    try:
        # Markdown-Datei lesen
        contents = await file.read()
        content = contents.decode('utf-8')
        
        # Titel aus Dateinamen extrahieren (ohne .md-Endung)
        title = file.filename
        if title.lower().endswith('.md'):
            title = title[:-3]
        
        # Dokument in Weaviate hinzufügen
        doc_id = weaviate_service.add_document(
            tenant_id=tenant_id,
            title=title,
            content=content,
            metadata={"file_type": "markdown"},
            source=source
        )
        
        # Dokument in der Datenbank speichern
        db_document = DocumentModel(
            id=doc_id,
            tenant_id=tenant_id,
            title=title,
            content=content,
            doc_metadata={"file_type": "markdown"},
            source=source
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        return {
            "message": "Markdown-Datei erfolgreich hinzugefügt",
            "document": {
                "id": doc_id,
                "title": title
            }
        }
    
    except Exception as e:
        db.rollback()  # Rollback bei Fehlern
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Verarbeiten der Markdown-Datei: {str(e)}"
        )


@router.get("/{document_id}/weaviate-status", response_model=WeaviateStatus)
async def get_document_weaviate_status(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """Weaviate-Status eines Dokuments abrufen"""
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.tenant_id == tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    
    status = await weaviate_service.get_document_status(tenant_id, document_id)
    return status


@router.post("/{document_id}/reindex")
async def reindex_document(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """Ein einzelnes Dokument neu indizieren"""
    document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.tenant_id == tenant_id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Dokument nicht gefunden")
    
    try:
        await weaviate_service.reindex_document(document)
        return {"message": "Dokument erfolgreich neu indiziert"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Neu-Indizieren des Dokuments: {str(e)}"
        )


@router.post("/reindex-all")
async def reindex_all_documents(
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """Alle Dokumente neu indizieren"""
    try:
        # Alle Dokumente des Tenants abrufen
        documents = db.query(DocumentModel).filter(
            DocumentModel.tenant_id == tenant_id
        ).all()
        
        if not documents:
            return {"message": "Keine Dokumente zum Neu-Indizieren gefunden"}
        
        # Dokumente in Document-Schema konvertieren
        doc_schemas = [Document.model_validate(doc) for doc in documents]
        
        # Alle Dokumente neu indizieren
        await weaviate_service.reindex_all_documents(tenant_id, doc_schemas)
        
        return {"message": f"{len(documents)} Dokumente erfolgreich neu indiziert"}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Neu-Indizieren der Dokumente: {str(e)}"
        )


@router.get("/{document_id}/status", response_model=WeaviateStatus)
async def get_document_status(
    document_id: str,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """Ruft den Indizierungsstatus eines Dokuments ab."""
    # Prüfen, ob das Dokument existiert
    db_document = db.query(DocumentModel).filter(
        DocumentModel.id == document_id,
        DocumentModel.tenant_id == tenant_id
    ).first()
    
    if not db_document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dokument nicht gefunden"
        )
    
    # Status von Weaviate abrufen
    status = await weaviate_service.get_document_status(tenant_id, document_id)
    return status 