from sqlalchemy import Column, String, DateTime
from datetime import datetime
from uuid import uuid4

from ..db.base_class import Base


class TokenBlacklist(Base):
    """
    Token-Blacklist-Modell zur Verwaltung von abgemeldeten oder ungültigen Tokens
    """
    __tablename__ = "token_blacklist"

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid4()))
    token = Column(String(255), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    blacklisted_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<TokenBlacklist {self.id}>" 