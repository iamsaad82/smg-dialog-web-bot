from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from ...db.models import (
    Tenant, TenantCreate, TenantUpdate, 
    InteractiveConfig, TenantInteractiveUpdate, TenantInteractiveConfig,
    UIComponentsConfig, UIComponentDefinition
)
from ...services.tenant_service import tenant_service
from ...services.interactive.factory import interactive_factory
from ...core.security import get_tenant_id_from_api_key, get_admin_api_key
from ...db.session import get_db
from ...core.config import settings

router = APIRouter()


@router.post("/", response_model=Tenant, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant: TenantCreate,
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """Erstellt einen neuen Tenant (Multi-Tenant-Unterstützung)."""
    new_tenant = tenant_service.create_tenant(db, tenant)
    return new_tenant


@router.get("/", response_model=List[Tenant])
async def get_all_tenants(
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """Ruft alle Tenants ab (nur für Admin)."""
    return tenant_service.get_all_tenants(db)


@router.get("/current", response_model=Tenant)
async def get_current_tenant(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_tenant_id_from_api_key)
):
    """Ruft den aktuellen Tenant basierend auf dem API-Key ab."""
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    return tenant


@router.get("/{tenant_id}", response_model=Tenant)
async def get_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """Ruft einen spezifischen Tenant ab (nur für Admin)."""
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    # Logging für Debugging
    print(f"[get_tenant] Tenant mit ID {tenant_id}:", tenant.dict())
    print(f"[get_tenant] is_brandenburg Wert: {tenant.is_brandenburg} (Typ: {type(tenant.is_brandenburg)})")
    
    # Stelle sicher, dass is_brandenburg als boolean vorhanden ist
    tenant_dict = tenant.dict()
    if 'is_brandenburg' not in tenant_dict or tenant_dict['is_brandenburg'] is None:
        tenant_dict['is_brandenburg'] = False
    
    return Tenant.model_validate(tenant_dict)


@router.put("/{tenant_id}", response_model=Tenant)
async def update_tenant(
    tenant_id: str,
    tenant_update: TenantUpdate,
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """Aktualisiert einen Tenant (nur für Admin)."""
    # Logging für eingehende Daten
    print(f"[update_tenant] Eingehende Daten für Tenant {tenant_id}:", tenant_update.dict(exclude_unset=True))
    
    updated_tenant = tenant_service.update_tenant(db, tenant_id, tenant_update)
    if not updated_tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    # Logging für aktualisierte Daten
    print(f"[update_tenant] Aktualisierter Tenant {tenant_id}:", updated_tenant.dict())
    print(f"[update_tenant] is_brandenburg Wert: {updated_tenant.is_brandenburg} (Typ: {type(updated_tenant.is_brandenburg)})")
    
    # Stelle sicher, dass is_brandenburg als boolean vorhanden ist
    tenant_dict = updated_tenant.dict()
    if 'is_brandenburg' not in tenant_dict or tenant_dict['is_brandenburg'] is None:
        tenant_dict['is_brandenburg'] = False
    
    return Tenant.model_validate(tenant_dict)


@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: str,
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """Löscht einen Tenant (nur für Admin)."""
    success = tenant_service.delete_tenant(db, tenant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    return None


# Endpunkte für interaktive Konfiguration

@router.get("/{tenant_id}/interactive", response_model=InteractiveConfig)
async def get_interactive_config(
    tenant_id: str,
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """Ruft die interaktive Konfiguration eines Tenants ab."""
    config = tenant_service.get_interactive_config(db, tenant_id)
    if not config:
        # Leere Konfiguration zurückgeben, wenn keine existiert
        return InteractiveConfig()
    return config


@router.put("/{tenant_id}/interactive", response_model=InteractiveConfig)
async def update_interactive_config(
    tenant_id: str,
    config_update: TenantInteractiveUpdate,
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """Aktualisiert die interaktive Konfiguration eines Tenants."""
    # Prüfen, ob der Tenant existiert
    tenant = tenant_service.get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant nicht gefunden"
        )
    
    # Konfiguration aktualisieren
    updated_config = tenant_service.update_interactive_config(
        db, tenant_id, config_update.interactive_config
    )
    
    # Neue Konfiguration im Factory registrieren
    interactive_factory.register_tenant_config(tenant_id, updated_config.dict())
    
    return updated_config


@router.options("/", include_in_schema=False)
@router.options("/{tenant_id}", include_in_schema=False)
async def options_tenant():
    """Handler für OPTIONS-Anfragen an Tenants-Endpunkte."""
    return {}


@router.get("/{tenant_id}/ui-components", response_model=UIComponentsConfig)
def get_ui_components_config(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_tenant_id: str = Depends(get_tenant_id_from_api_key)
):
    """
    Ruft die UI-Komponenten-Konfiguration eines Tenants ab.
    """
    # Zugriffsprüfung: Nur der Tenant selbst oder der Admin darf zugreifen
    if current_tenant_id != tenant_id and current_tenant_id != settings.ADMIN_TENANT_ID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Keine Berechtigung für diese Operation"
        )
    
    config = tenant_service.get_ui_components_config(db, tenant_id)
    
    # Wenn keine Konfiguration gefunden, eine Standardkonfiguration zurückgeben
    if not config:
        return UIComponentsConfig(
            prompt="Du bist ein hilfreicher Assistent. Verwende spezielle UI-Komponenten, um Informationen ansprechend darzustellen.",
            rules=[]
        )
    
    return config


@router.post("/{tenant_id}/ui-components", response_model=UIComponentsConfig)
def update_ui_components_config(
    tenant_id: str,
    config: UIComponentsConfig,
    db: Session = Depends(get_db),
    current_tenant_id: str = Depends(get_tenant_id_from_api_key)
):
    """
    Aktualisiert die UI-Komponenten-Konfiguration eines Tenants.
    """
    # Zugriffsprüfung: Nur der Tenant selbst oder der Admin darf zugreifen
    if current_tenant_id != tenant_id and current_tenant_id != settings.ADMIN_TENANT_ID:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Keine Berechtigung für diese Operation"
        )
    
    try:
        updated_config = tenant_service.create_or_update_ui_components_config(db, tenant_id, config)
        return updated_config
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fehler beim Aktualisieren der UI-Komponenten-Konfiguration: {str(e)}"
        )


# Neue Endpunkte für die UI-Komponenten-Definitionen

@router.get("/ui-components-definitions", response_model=List[Dict[str, Any]])
async def get_ui_components_definitions(
    db: Session = Depends(get_db),
    current_tenant_id: str = Depends(get_tenant_id_from_api_key)
):
    """
    Gibt alle verfügbaren UI-Komponenten-Definitionen zurück.
    Kann von jedem Tenant aufgerufen werden.
    """
    definitions = db.query(UIComponentDefinition).all()
    
    result = []
    for definition in definitions:
        result.append({
            "id": definition.id,
            "name": definition.name,
            "description": definition.description,
            "example_format": definition.example_format,
            "created_at": definition.created_at,
            "updated_at": definition.updated_at
        })
    
    return result

@router.post("/ui-components-definitions", status_code=status.HTTP_201_CREATED)
async def create_ui_component_definition(
    definition: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """
    Erstellt eine neue UI-Komponenten-Definition.
    Nur für Administratoren.
    """
    # Pflichtfelder prüfen
    if "name" not in definition or "example_format" not in definition:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name und example_format sind Pflichtfelder"
        )
    
    # Prüfen, ob bereits eine Definition mit diesem Namen existiert
    existing = db.query(UIComponentDefinition).filter(UIComponentDefinition.name == definition["name"]).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Eine Definition mit dem Namen '{definition['name']}' existiert bereits"
        )
    
    # Neue Definition erstellen
    new_definition = UIComponentDefinition(
        name=definition["name"],
        description=definition.get("description"),
        example_format=definition["example_format"]
    )
    
    db.add(new_definition)
    db.commit()
    db.refresh(new_definition)
    
    return {
        "id": new_definition.id,
        "name": new_definition.name,
        "description": new_definition.description,
        "example_format": new_definition.example_format,
        "created_at": new_definition.created_at,
        "updated_at": new_definition.updated_at
    }

@router.put("/ui-components-definitions/{definition_id}")
async def update_ui_component_definition(
    definition_id: str,
    definition: Dict[str, Any],
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """
    Aktualisiert eine bestehende UI-Komponenten-Definition.
    Nur für Administratoren.
    """
    # Definition finden
    db_definition = db.query(UIComponentDefinition).filter(UIComponentDefinition.id == definition_id).first()
    if not db_definition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Definition mit ID {definition_id} nicht gefunden"
        )
    
    # Felder aktualisieren
    if "name" in definition:
        # Bei Namensänderung prüfen, ob der neue Name bereits existiert
        if definition["name"] != db_definition.name:
            existing = db.query(UIComponentDefinition).filter(UIComponentDefinition.name == definition["name"]).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Eine Definition mit dem Namen '{definition['name']}' existiert bereits"
                )
        db_definition.name = definition["name"]
    
    if "description" in definition:
        db_definition.description = definition["description"]
    
    if "example_format" in definition:
        db_definition.example_format = definition["example_format"]
    
    db.commit()
    db.refresh(db_definition)
    
    return {
        "id": db_definition.id,
        "name": db_definition.name,
        "description": db_definition.description,
        "example_format": db_definition.example_format,
        "created_at": db_definition.created_at,
        "updated_at": db_definition.updated_at
    }

@router.delete("/ui-components-definitions/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ui_component_definition(
    definition_id: str,
    db: Session = Depends(get_db),
    admin_api_key: str = Depends(get_admin_api_key)
):
    """
    Löscht eine UI-Komponenten-Definition.
    Nur für Administratoren.
    """
    # Definition finden
    db_definition = db.query(UIComponentDefinition).filter(UIComponentDefinition.id == definition_id).first()
    if not db_definition:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Definition mit ID {definition_id} nicht gefunden"
        )
    
    # Definition löschen
    db.delete(db_definition)
    db.commit()
    
    return None

@router.get("/{tenant_id}/details", response_model=Tenant)
async def get_tenant_details(
    tenant_id: str,
    db: Session = Depends(get_db),
    current_tenant_id: str = Depends(get_tenant_id_from_api_key)
):
    """
    Ruft Details eines Tenants ab, wenn der Benutzer authentifiziert ist.
    Diese Route erlaubt authentifizierten Benutzern, Tenant-Details für UI-Zwecke abzurufen,
    ohne Admin-Rechte zu benötigen.
    """
    try:
        # Ausführliches Logging für Debugging
        print(f"[get_tenant_details] API-Aufruf mit tenant_id={tenant_id}, authenticated_tenant_id={current_tenant_id}")
        print(f"[get_tenant_details] Umgebung (ENV): {settings.ENV}")
        
        # Im Dev-Modus erlauben wir direkten Zugriff ohne API-Key-Prüfung
        if settings.ENV == "dev":
            print(f"[get_tenant_details] DEV-MODUS: Erlaube direkten Zugriff ohne API-Key-Prüfung")
            # Alternative Implementierung: Tenant direkt abrufen ohne weitere Prüfungen
            tenant = tenant_service.get_tenant_by_id(db, tenant_id)
            if not tenant:
                print(f"[get_tenant_details] Tenant mit ID {tenant_id} nicht gefunden")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Tenant nicht gefunden"
                )
            
            # Debugging-Informationen
            print(f"[get_tenant_details] Tenant mit ID {tenant_id} gefunden")
            
            # Erfolgreiche Rückgabe
            return tenant
        
        # Sicherheitsabfrage für Produktionsumgebungen
        if current_tenant_id != tenant_id:
            print(f"[get_tenant_details] Zugriff verweigert: Anfragender Tenant ({current_tenant_id}) ≠ Angeforderter Tenant ({tenant_id})")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Nur Benutzer des Tenants können die Details einsehen"
            )
        
        # Tenant aus der Datenbank holen
        tenant = tenant_service.get_tenant_by_id(db, tenant_id)
        if not tenant:
            print(f"[get_tenant_details] Tenant mit ID {tenant_id} nicht gefunden")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tenant nicht gefunden"
            )
        
        # Debugging-Informationen
        print(f"[get_tenant_details] Tenant mit ID {tenant_id} gefunden")
        
        # Erfolgreiche Rückgabe
        return tenant
    except HTTPException as he:
        # HTTPException direkt weiterleiten
        print(f"[get_tenant_details] HTTP-Ausnahme: {he.status_code} - {he.detail}")
        raise he
    except Exception as e:
        # Alle anderen Ausnahmen als 500 mit Debugging-Informationen
        error_msg = f"Unerwarteter Fehler beim Abrufen des Tenants: {str(e)}"
        print(f"[get_tenant_details] FEHLER: {error_msg}")
        import traceback
        print(f"[get_tenant_details] Stacktrace: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        ) 