import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
import os
from sqlalchemy.orm import Session
from ..db.models import (
    TenantModel, DocumentModel, InteractiveConfigModel, UIComponentsConfigModel,
    Tenant, TenantCreate, TenantUpdate, InteractiveConfig,
    UIComponentsConfig, UIComponentsConfigResponse, UIComponentDefinition, UIComponentsConfigDB
)
from ..core.config import settings
from ..services.weaviate_service import weaviate_service

class TenantService:
    """Service zur Verwaltung von Tenants (Kunden) im System mit PostgreSQL-Datenbank."""
    
    def create_tenant(self, db: Session, tenant_create: TenantCreate) -> Tenant:
        """Erstellt einen neuen Tenant."""
        tenant_data = tenant_create.model_dump()
        if not tenant_data.get("api_key"):
            tenant_data["api_key"] = str(uuid.uuid4())
        
        db_tenant = TenantModel(**tenant_data)
        
        db.add(db_tenant)
        db.commit()
        db.refresh(db_tenant)
        
        # Erstellt die entsprechende Weaviate-Klasse für den Tenant
        weaviate_service.create_tenant_schema(db_tenant.id)
        
        return Tenant.model_validate(db_tenant)
    
    def get_tenant_by_id(self, db: Session, tenant_id: str) -> Optional[Tenant]:
        """Ruft einen Tenant anhand seiner ID ab."""
        db_tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not db_tenant:
            return None
        return Tenant.model_validate(db_tenant)
    
    def get_tenant_by_api_key(self, db: Session, api_key: str) -> Optional[Tenant]:
        """Ruft einen Tenant anhand seines API-Keys ab."""
        db_tenant = db.query(TenantModel).filter(TenantModel.api_key == api_key).first()
        if not db_tenant:
            return None
        return Tenant.model_validate(db_tenant)
    
    def get_all_tenants(self, db: Session) -> List[Tenant]:
        """Ruft alle Tenants ab."""
        db_tenants = db.query(TenantModel).all()
        return [Tenant.model_validate(tenant) for tenant in db_tenants]
    
    def update_tenant(self, db: Session, tenant_id: str, tenant_update: TenantUpdate) -> Optional[Tenant]:
        """Aktualisiert einen bestehenden Tenant."""
        db_tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not db_tenant:
            return None
        
        update_data = tenant_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_tenant, key, value)
        
        db_tenant.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_tenant)
        
        return Tenant.model_validate(db_tenant)
    
    def delete_tenant(self, db: Session, tenant_id: str) -> bool:
        """Löscht einen Tenant und seine Daten."""
        db_tenant = db.query(TenantModel).filter(TenantModel.id == tenant_id).first()
        if not db_tenant:
            return False
        
        # Löscht auch die Weaviate-Daten des Tenants
        weaviate_service.delete_tenant_schema(tenant_id)
        
        db.delete(db_tenant)
        db.commit()
        
        return True
    
    def verify_api_key(self, db: Session, api_key: str) -> Optional[str]:
        """Überprüft einen API-Key und gibt die entsprechende Tenant-ID zurück."""
        db_tenant = db.query(TenantModel).filter(TenantModel.api_key == api_key).first()
        if not db_tenant:
            return None
        return db_tenant.id
    
    def get_interactive_config(self, db: Session, tenant_id: str) -> Optional[InteractiveConfig]:
        """Ruft die interaktive Konfiguration eines Tenants ab."""
        db_config = db.query(InteractiveConfigModel).filter(
            InteractiveConfigModel.tenant_id == tenant_id
        ).first()
        
        if not db_config:
            # Erstelle eine neue Konfiguration mit Standardwerten
            db_config = InteractiveConfigModel(
                tenant_id=tenant_id,
                config={"contacts": []}
            )
            db.add(db_config)
            db.commit()
            db.refresh(db_config)
        
        return InteractiveConfig.model_validate(db_config.config)
    
    def update_interactive_config(self, db: Session, tenant_id: str, config: InteractiveConfig) -> InteractiveConfig:
        """Aktualisiert die interaktive Konfiguration eines Tenants."""
        db_config = db.query(InteractiveConfigModel).filter(
            InteractiveConfigModel.tenant_id == tenant_id
        ).first()
        
        if not db_config:
            db_config = InteractiveConfigModel(
                tenant_id=tenant_id,
                config=config.model_dump()
            )
            db.add(db_config)
        else:
            db_config.config = config.model_dump()
        
        db.commit()
        db.refresh(db_config)
        
        return InteractiveConfig.model_validate(db_config.config)
    
    def get_ui_components_config(self, db: Session, tenant_id: str) -> Optional[UIComponentsConfig]:
        """
        Gibt die UI-Komponenten-Konfiguration eines Tenants zurück.
        """
        # Angepasst für die neue Struktur mit UIComponentsConfigDB
        config = db.query(UIComponentsConfigDB).filter(UIComponentsConfigDB.tenant_id == tenant_id).first()
        
        if not config:
            return None
        
        return UIComponentsConfig(
            prompt=config.prompt,
            rules=config.rules,
            defaultExamples=config.default_examples
        )
    
    def create_or_update_ui_components_config(self, db: Session, tenant_id: str, config: UIComponentsConfig) -> UIComponentsConfig:
        """
        Erstellt oder aktualisiert die UI-Komponenten-Konfiguration eines Tenants.
        """
        # Prüfen, ob der Tenant existiert
        tenant = self.get_tenant_by_id(db, tenant_id)
        if not tenant:
            raise ValueError(f"Tenant mit ID {tenant_id} nicht gefunden")
        
        # Nach bestehender Konfiguration suchen
        existing_config = db.query(UIComponentsConfigDB).filter(UIComponentsConfigDB.tenant_id == tenant_id).first()
        
        if existing_config:
            # Konfiguration aktualisieren
            existing_config.prompt = config.prompt
            existing_config.rules = [rule.dict() for rule in config.rules]
            
            # Neue Felder aktualisieren, wenn vorhanden
            if hasattr(config, 'defaultExamples') and config.defaultExamples is not None:
                existing_config.default_examples = config.defaultExamples
            
            db.commit()
            db.refresh(existing_config)
            
            return UIComponentsConfig(
                prompt=existing_config.prompt,
                rules=existing_config.rules,
                defaultExamples=existing_config.default_examples
            )
        else:
            # Neue Konfiguration erstellen
            new_config = UIComponentsConfigDB(
                tenant_id=tenant_id,
                prompt=config.prompt,
                rules=[rule.dict() for rule in config.rules]
            )
            
            # Neue Felder setzen, wenn vorhanden
            if hasattr(config, 'defaultExamples') and config.defaultExamples is not None:
                new_config.default_examples = config.defaultExamples
            
            db.add(new_config)
            db.commit()
            db.refresh(new_config)
            
            return UIComponentsConfig(
                prompt=new_config.prompt,
                rules=new_config.rules,
                defaultExamples=new_config.default_examples
            )
    
    def get_component_definition(self, db: Session, component_name: str) -> Optional[dict]:
        """
        Gibt die Definition einer UI-Komponente zurück.
        """
        definition = db.query(UIComponentDefinition).filter(UIComponentDefinition.name == component_name).first()
        
        if not definition:
            return None
        
        return {
            "id": definition.id,
            "name": definition.name,
            "description": definition.description,
            "example_format": definition.example_format
        }
    
    def get_all_component_definitions(self, db: Session) -> List[dict]:
        """
        Gibt alle UI-Komponenten-Definitionen zurück.
        """
        definitions = db.query(UIComponentDefinition).all()
        
        result = []
        for definition in definitions:
            result.append({
                "id": definition.id,
                "name": definition.name,
                "description": definition.description,
                "example_format": definition.example_format
            })
        
        return result


# Singleton-Instanz des Services
tenant_service = TenantService() 