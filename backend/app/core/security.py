from fastapi import Depends, HTTPException, Security, status, Request
from fastapi.security import APIKeyHeader
from typing import Optional
from sqlalchemy.orm import Session
from ..services.tenant_service import tenant_service
from ..core.config import settings
from ..db.session import get_db
import os

# Header für API-Key
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_tenant_id_from_api_key(
    request: Request,
    api_key_header: Optional[str] = Security(API_KEY_HEADER),
    db: Session = Depends(get_db)
) -> str:
    """
    Überprüft den API-Key und gibt die entsprechende Tenant-ID zurück.
    Prüft zuerst den Header, dann den Query-Parameter.
    Wirft eine HTTPException, wenn der API-Key ungültig ist.
    """
    # Zuerst Header-API-Key prüfen
    api_key = api_key_header
    
    # Wenn kein Header-API-Key, dann Query-Parameter prüfen
    if not api_key:
        api_key = request.query_params.get("api_key")
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API-Key nicht angegeben"
        )
    
    tenant_id = tenant_service.verify_api_key(db, api_key)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger API-Key"
        )
    return tenant_id


# Alternative Authentifizierung über Query-Parameter für Einbettungen
async def get_tenant_id_from_query(
    api_key: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Optional[str]:
    """
    Überprüft den API-Key aus einem Query-Parameter und gibt die entsprechende Tenant-ID zurück.
    Gibt None zurück, wenn kein API-Key angegeben wurde oder der API-Key ungültig ist.
    """
    if not api_key:
        return None
    
    return tenant_service.verify_api_key(db, api_key)


# Admin-Authentifizierung für Verwaltungsfunktionen
async def get_admin_api_key(
    request: Request,
    api_key_header: Optional[str] = Security(API_KEY_HEADER)
) -> str:
    """
    Überprüft, ob der API-Key gültig und für Admin-Funktionen berechtigt ist.
    """
    # Zuerst Header-API-Key prüfen
    api_key = api_key_header
    
    # Wenn kein Header-API-Key, dann Query-Parameter prüfen
    if not api_key:
        api_key = request.query_params.get("api_key")
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin-API-Key nicht angegeben"
        )
    
    # Admin-API-Key aus Umgebungsvariablen holen
    admin_api_key = os.getenv("ADMIN_API_KEY", "")
    
    # Prüfen, ob der API-Key mit dem Admin-Key übereinstimmt
    if admin_api_key and api_key == admin_api_key:
        return api_key
    
    # Im Entwicklungsmodus akzeptieren wir jeden API-Key, wenn kein ADMIN_API_KEY gesetzt ist
    if not admin_api_key:
        return api_key
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Nicht autorisiert für Admin-Funktionen"
    ) 