from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import uuid
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Integer, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic.types import UUID4

Base = declarative_base()

# SQLAlchemy Modelle
class TenantModel(Base):
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    api_key = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    description = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    bot_name = Column(String, nullable=False, default="KI-Assistent")
    bot_welcome_message = Column(String, nullable=False, default="Hallo! Wie kann ich Ihnen helfen?")
    primary_color = Column(String, nullable=False, default="#4f46e5")
    secondary_color = Column(String, nullable=False, default="#ffffff")
    logo_url = Column(String, nullable=True)
    custom_instructions = Column(String, nullable=True)
    use_mistral = Column(Boolean, nullable=False, default=False)
    bot_message_bg_color = Column(String, nullable=False, default="#374151")
    bot_message_text_color = Column(String, nullable=False, default="#ffffff")
    user_message_bg_color = Column(String, nullable=False, default="#4f46e5")
    user_message_text_color = Column(String, nullable=False, default="#ffffff")
    config = Column(JSON, nullable=True)
    
    # Beziehungen
    documents = relationship("DocumentModel", back_populates="tenant", cascade="all, delete-orphan")
    interactive_config = relationship("InteractiveConfigModel", back_populates="tenant", uselist=False, cascade="all, delete-orphan")
    ui_components_config = relationship("UIComponentsConfigModel", back_populates="tenant", uselist=False, cascade="all, delete-orphan")

class DocumentModel(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    source = Column(String, nullable=True)
    doc_metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Beziehungen
    tenant = relationship("TenantModel", back_populates="documents")

class InteractiveConfigModel(Base):
    __tablename__ = "interactive_configs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), unique=True, nullable=False)
    config = Column(JSON, nullable=False, default=dict)
    
    # Beziehungen
    tenant = relationship("TenantModel", back_populates="interactive_config")

class UIComponentsConfigModel(Base):
    __tablename__ = "ui_components_configs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), unique=True, nullable=False)
    prompt = Column(String, nullable=False)
    rules = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Beziehungen
    tenant = relationship("TenantModel", back_populates="ui_components_config")

class TenantBase(BaseModel):
    """Basismodell für Tenants."""
    name: str
    description: Optional[str] = None
    contact_email: Optional[str] = None
    bot_name: str = "KI-Assistent"
    bot_welcome_message: str = "Hallo! Wie kann ich Ihnen helfen?"
    primary_color: str = "#4f46e5"
    secondary_color: str = "#ffffff"
    logo_url: Optional[str] = None
    custom_instructions: Optional[str] = None
    use_mistral: bool = False
    # Neue Felder für Chat-Bubble-Farben
    bot_message_bg_color: str = "#374151"
    bot_message_text_color: str = "#ffffff"
    user_message_bg_color: str = "#4f46e5"
    user_message_text_color: str = "#ffffff"


class TenantCreate(TenantBase):
    """Modell zum Erstellen eines Tenants."""
    api_key: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))


class TenantUpdate(BaseModel):
    """Modell zum Aktualisieren eines Tenants."""
    name: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    custom_instructions: Optional[str] = None
    bot_name: Optional[str] = None
    bot_welcome_message: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    logo_url: Optional[str] = None
    use_mistral: Optional[bool] = None
    # Neue optionale Felder für Chat-Bubble-Farben
    bot_message_bg_color: Optional[str] = None
    bot_message_text_color: Optional[str] = None
    user_message_bg_color: Optional[str] = None
    user_message_text_color: Optional[str] = None


class Tenant(TenantBase):
    """Vollständiges Tenant-Modell mit allen Feldern."""
    id: Union[str, UUID4]
    api_key: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DocumentBase(BaseModel):
    """Basismodell für Dokumente in der Wissensbasis."""
    title: str
    content: str
    source: Optional[str] = None
    doc_metadata: Optional[Dict[str, Any]] = None


class DocumentCreate(DocumentBase):
    """Modell zum Erstellen eines Dokuments."""
    pass


class Document(DocumentBase):
    """Vollständiges Dokument-Modell mit allen Feldern."""
    id: Union[str, UUID4]
    tenant_id: Union[str, UUID4]
    created_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True


class SearchQuery(BaseModel):
    """Modell für Suchanfragen."""
    query: str
    limit: Optional[int] = 5
    hybrid_search: Optional[bool] = True


class ChatMessage(BaseModel):
    """Modell für Chat-Nachrichten."""
    role: str  # "user", "assistant", "system"
    content: str


class ChatQuery(BaseModel):
    """Modell für Chat-Anfragen."""
    messages: List[ChatMessage]
    stream: Optional[bool] = True
    use_mistral: Optional[bool] = False
    custom_instructions: Optional[str] = None


class ApiKeyAuth(BaseModel):
    """Modell für API-Key-Authentifizierung."""
    api_key: str


class ErrorResponse(BaseModel):
    """Modell für Fehlerantworten."""
    detail: str


class ContactLink(BaseModel):
    """Link in einer Kontaktkarte."""
    type: str  # 'appointment', 'map', 'website', 'email', 'phone'
    label: str
    url: str


class ContactInfo(BaseModel):
    """Kontaktinformationen für eine interaktive Kontaktkarte."""
    id: str
    name: str
    type: str  # 'department', 'store', 'doctor', etc.
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    hours: Optional[str] = None
    links: List[ContactLink] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)


class InteractiveConfig(BaseModel):
    """Konfiguration für interaktive Elemente eines Tenants."""
    contacts: List[ContactInfo] = Field(default_factory=list)


class TenantInteractiveUpdate(BaseModel):
    """Update der interaktiven Konfiguration eines Tenants."""
    interactive_config: InteractiveConfig


class TenantInteractiveConfig(BaseModel):
    """Interaktive Konfiguration eines Tenants."""
    tenant_id: str
    config: InteractiveConfig 

class ComponentRule(BaseModel):
    """Regel für eine UI-Komponente."""
    id: str
    component: str
    triggers: List[str]
    isEnabled: bool
    # Neue Felder für das UI-Komponenten-System
    exampleFormat: Optional[str] = None  # JSON-Beispielformat für die Komponente
    description: Optional[str] = None  # Beschreibung für Redakteure

class UIComponentsConfig(BaseModel):
    """Konfiguration für UI-Komponenten."""
    prompt: str
    rules: List[ComponentRule]
    # Neue Felder für allgemeine Beispiele und Beschreibungen
    defaultExamples: Optional[Dict[str, str]] = None  # Standard-Beispiele für Komponententypen

# SQLAlchemy Modell für UI-Komponenten-Konfiguration
class UIComponentsConfigDB(Base):
    __tablename__ = "ui_components_configs"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    tenant_id = Column(String, ForeignKey("tenants.id"), nullable=False)
    prompt = Column(Text, nullable=False, default="Du bist ein hilfreicher Assistent.")
    rules = Column(JSON, nullable=False, default=list)
    default_examples = Column(JSON, nullable=True)  # Neue Spalte für Standard-Beispiele
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Datenbank-Modell für einzelne Komponenten-Definitionen
class UIComponentDefinition(Base):
    __tablename__ = "ui_component_definitions"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)  # z.B. "OpeningHoursTable"
    description = Column(Text, nullable=True)  # Beschreibung für Redakteure
    example_format = Column(Text, nullable=False)  # JSON-Beispielformat
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BotComponentResponse(BaseModel):
    """Botantwort mit UI-Komponente."""
    text: str
    component: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class UIComponentsConfigResponse(BaseModel):
    """Antwortmodell für UI-Komponenten-Konfiguration."""
    id: Union[str, UUID4]  # Akzeptiert sowohl String als auch UUID
    tenant_id: Union[str, UUID4]  # Akzeptiert sowohl String als auch UUID
    prompt: str
    rules: List[ComponentRule]
    defaultExamples: Optional[Dict[str, str]] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True 