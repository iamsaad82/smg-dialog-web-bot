from sqlalchemy import Boolean, Column, String, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from typing import Dict, Any, Optional

from ..db.base_class import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    renderer_type = Column(String, default="default", nullable=False)
    config = Column(JSON, nullable=True)

    # Beziehungen
    managing_agencies = relationship("Agency", secondary="agency_tenant", back_populates="managed_tenants")
    assigned_users = relationship("User", secondary="user_tenant", back_populates="assigned_tenants") 