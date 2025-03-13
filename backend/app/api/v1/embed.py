from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from sqlalchemy.orm import Session
from ...db.session import get_db
from ...core.security import get_tenant_id_from_api_key
from ...services.tenant_service import tenant_service
from ...core.config import settings
import os

router = APIRouter()

@router.get("/config")
async def get_embed_config(
    x_api_key: Optional[str] = Header(None),
    tenant_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Gibt die Konfiguration für das Embed-Script zurück.
    Kann entweder über einen API-Key im Header oder eine direkte Tenant-ID abgerufen werden.
    """
    # Testmodus für Frontend-Entwicklung
    if x_api_key == "test" or tenant_id == "test":
        return {
            "botName": "Demo Bot",
            "welcomeMessage": "Hallo! Ich bin ein Demo-Bot. Wie kann ich Ihnen helfen?",
            "primaryColor": "#4f46e5",
            "secondaryColor": "#ffffff",
            "logoUrl": None
        }
    
    if not x_api_key and not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entweder X-API-Key Header oder tenant_id Parameter muss angegeben werden."
        )
    
    # Tenant-ID aus API-Key ermitteln, falls nur API-Key gegeben ist
    resolved_tenant_id = tenant_id
    if x_api_key and not tenant_id:
        try:
            resolved_tenant_id = await get_tenant_id_from_api_key(db, x_api_key)
        except:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültiger API-Key"
            )
    
    # Tenant-Daten laden
    tenant = tenant_service.get_tenant_by_id(db, resolved_tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    # Konfiguration zurückgeben
    # Diese Werte können später aus der Datenbank geladen werden,
    # sobald die UI für die Anpassung implementiert ist
    return {
        "botName": tenant.name,
        "welcomeMessage": tenant.bot_welcome_message if hasattr(tenant, 'bot_welcome_message') and tenant.bot_welcome_message else "Hallo! Wie kann ich Ihnen helfen?",
        "primaryColor": tenant.primary_color if hasattr(tenant, 'primary_color') and tenant.primary_color else "#4f46e5",
        "secondaryColor": tenant.secondary_color if hasattr(tenant, 'secondary_color') and tenant.secondary_color else "#ffffff",
        "logoUrl": tenant.logo_url if hasattr(tenant, 'logo_url') and tenant.logo_url else None
    } 