from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from typing import List, Optional

from ..db.base_class import Base
from pydantic import BaseModel

# Verbindungstabelle für Agency-Tenant-Beziehung (viele zu viele)
agency_tenant = Table(
    "agency_tenant",
    Base.metadata,
    Column("agency_id", String, ForeignKey("agencies.id"), primary_key=True),
    Column("tenant_id", String, ForeignKey("tenants.id"), primary_key=True),
)

class Agency(Base):
    """
    Agenturmodell für die Verwaltung von Mandanten
    """
    __tablename__ = "agencies"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    contact_email = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    website = Column(String, nullable=True)
    
    # Zeitstempel
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Beziehungen
    users = relationship("User", back_populates="agency")
    managed_tenants = relationship("Tenant", secondary=agency_tenant, back_populates="managing_agencies")

# Pydantic-Modelle für API-Requests und Responses
class AgencyBase(BaseModel):
    name: str
    description: Optional[str] = None
    contact_email: str
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

class AgencyCreate(AgencyBase):
    managed_tenant_ids: Optional[List[str]] = []

class AgencyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    contact_email: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    managed_tenant_ids: Optional[List[str]] = None

class AgencyResponse(AgencyBase):
    id: str
    created_at: datetime
    updated_at: datetime
    managed_tenant_ids: List[str] = []

    class Config:
        orm_mode = True
        
    @classmethod
    def from_orm(cls, obj):
        if obj.managed_tenants:
            obj.managed_tenant_ids = [tenant.id for tenant in obj.managed_tenants]
        return super().from_orm(obj) 