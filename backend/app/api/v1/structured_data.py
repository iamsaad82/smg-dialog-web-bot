from fastapi import APIRouter, Depends, HTTPException, status, Query, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import json
import os
import tempfile
from pydantic import BaseModel
from ...services.structured_data_service import structured_data_service
from ...services.tenant_service import tenant_service
from ...core.security import get_tenant_id_from_api_key, get_current_user
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...db.models import User

router = APIRouter()


class StructuredDataSearchQuery(BaseModel):
    """Schema für Suchanfragen nach strukturierten Daten."""
    query: str
    data_type: str
    limit: int = 5


@router.post("/search")
async def search_structured_data(
    query: StructuredDataSearchQuery,
    tenant_id: str = Depends(get_tenant_id_from_api_key),
    db: Session = Depends(get_db)
):
    """
    Durchsucht strukturierte Daten eines bestimmten Typs.
    
    - **query**: Die Suchanfrage
    - **data_type**: Typ der Daten (school, office, event)
    - **limit**: Maximale Anzahl von Ergebnissen
    """
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    # Validierung des Datentyps
    if query.data_type not in structured_data_service.SUPPORTED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Nicht unterstützter Datentyp. Erlaubte Typen: {', '.join(structured_data_service.SUPPORTED_TYPES)}"
        )
    
    results = structured_data_service.search_structured_data(
        tenant_id=tenant_id,
        data_type=query.data_type,
        query=query.query,
        limit=query.limit
    )
    
    return {"results": results}


@router.post("/import/brandenburg")
async def import_brandenburg_data(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Importiert strukturierte Daten aus einer Brandenburg-XML-Datei.
    Erfordert Admin-Rechte.
    
    - **file**: XML-Datei mit Brandenburg-Daten
    """
    # Prüfen, ob Benutzer Admin ist
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können diese Funktion nutzen"
        )
    
    # Prüfen, ob der Dateiname auf .xml endet
    if not file.filename or not file.filename.endswith('.xml'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nur XML-Dateien werden unterstützt"
        )
    
    # Alle Tenants mit Brandenburg-Konfiguration holen
    tenants = tenant_service.get_all_tenants(db)
    brandenburg_tenants = [t for t in tenants if getattr(t, 'is_brandenburg', False)]
    
    if not brandenburg_tenants:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keine Brandenburg-Tenants gefunden"
        )
    
    try:
        # Temporäre Datei erstellen
        suffix = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            contents = await file.read()
            temp.write(contents)
            temp_filename = temp.name
            
        # XML-Import für jeden Brandenburg-Tenant durchführen
        results = {}
        for tenant in brandenburg_tenants:
            tenant_id = str(tenant.id)
            result = structured_data_service.import_brandenburg_data(
                xml_file_path=temp_filename,
                tenant_id=tenant_id
            )
            results[tenant.name] = result
            
        # Temp-Datei löschen
        os.unlink(temp_filename)
        
        return {"message": "Import erfolgreich", "results": results}
    
    except Exception as e:
        # Sicherstellen, dass temporäre Datei gelöscht wird
        if 'temp_filename' in locals():
            try:
                os.unlink(temp_filename)
            except:
                pass
                
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Importieren der Daten: {str(e)}"
        )


class ImportFromUrlRequest(BaseModel):
    """Schema für URL-Import-Anfragen."""
    url: str = "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"


@router.post("/import/brandenburg/url")
async def import_brandenburg_data_from_url(
    request: ImportFromUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Importiert strukturierte Daten aus einer Brandenburg-XML-Datei über eine URL.
    Erfordert Admin-Rechte.
    
    - **url**: URL zur XML-Datei (Standard: https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml)
    """
    # Prüfen, ob Benutzer Admin ist
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nur Administratoren können diese Funktion nutzen"
        )
    
    # Prüfen, ob die URL valide ist
    if not request.url.startswith(('http://', 'https://')) or not request.url.endswith('.xml'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Die URL muss mit http:// oder https:// beginnen und auf .xml enden"
        )
    
    # Alle Tenants mit Brandenburg-Konfiguration holen
    tenants = tenant_service.get_all_tenants(db)
    brandenburg_tenants = [t for t in tenants if getattr(t, 'is_brandenburg', False)]
    
    if not brandenburg_tenants:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Keine Brandenburg-Tenants gefunden"
        )
    
    try:
        # XML-Import für jeden Brandenburg-Tenant durchführen
        results = {}
        for tenant in brandenburg_tenants:
            tenant_id = str(tenant.id)
            result = structured_data_service.import_brandenburg_data_from_url(
                url=request.url,
                tenant_id=tenant_id
            )
            results[tenant.name] = result
            
        return {"message": "Import erfolgreich", "results": results}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Importieren der Daten von URL: {str(e)}"
        ) 