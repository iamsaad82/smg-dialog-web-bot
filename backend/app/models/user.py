from sqlalchemy import Boolean, Column, String, ForeignKey, DateTime, Table, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from uuid import uuid4

from ..db.base_class import Base

# EmailStr wieder einführen, da das Paket jetzt korrekt installiert ist
from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List, Any


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    AGENCY_ADMIN = "agency_admin"
    EDITOR = "editor"
    VIEWER = "viewer"


# Verbindungstabelle für User-Tenant-Beziehung (viele zu viele)
user_tenant = Table(
    "user_tenant",
    Base.metadata,
    Column("user_id", String(36), ForeignKey("users.id"), primary_key=True),
    Column("tenant_id", String(36), ForeignKey("tenants.id"), primary_key=True),
)


class User(Base):
    """
    Benutzermodell mit Authentifizierungsfeldern
    """
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid4()))
    email = Column(String(100), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String, default=UserRole.VIEWER.value, nullable=False)
    agency_id = Column(String(36), ForeignKey("agencies.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Authentifizierungsfelder
    last_login = Column(DateTime, nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # Zeitstempel
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Beziehungen
    agency = relationship("Agency", back_populates="users")
    assigned_tenants = relationship("Tenant", secondary=user_tenant, back_populates="assigned_users")
    
    def __repr__(self):
        return f"<User {self.email}>"


# Pydantic-Modelle für API-Requests und Responses
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    agency_id: Optional[str] = None
    

class UserCreate(UserBase):
    password: str
    assigned_tenant_ids: Optional[List[str]] = []
    is_active: bool = True
    is_temporary_password: bool = False


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    agency_id: Optional[str] = None
    assigned_tenant_ids: Optional[List[str]] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: Any
    updated_at: Any
    assigned_tenant_ids: List[str] = []

    class Config:
        orm_mode = True
        
    @validator('assigned_tenant_ids', pre=True)
    def extract_tenant_ids(cls, v):
        if isinstance(v, list) and len(v) > 0 and hasattr(v[0], 'id'):
            # Fall: Liste von Tenant-Objekten
            return [tenant.id for tenant in v]
        return v or [] 