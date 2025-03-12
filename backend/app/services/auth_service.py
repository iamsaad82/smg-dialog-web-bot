from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from pydantic import EmailStr
import secrets
import string
from uuid import uuid4

from ..models.user import User
from ..models.token import TokenBlacklist
from ..core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
    REFRESH_TOKEN_EXPIRE_DAYS
)
from .user_service import user_service


class AuthService:
    """
    Service-Klasse für die Authentifizierung und Token-Verwaltung
    """

    def authenticate(
        self, db: Session, username: str, password: str
    ) -> Optional[Tuple[User, str, str]]:
        """
        Authentifiziert einen Benutzer und gibt den Benutzer sowie Access- und Refresh-Tokens zurück
        """
        user = user_service.authenticate_user(db, username, password)
        if not user:
            return None
        
        # Letzten Login-Zeitpunkt aktualisieren
        user_service.update_last_login(db, user.id)
        
        # Tokens erstellen
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        
        return user, access_token, refresh_token
    
    def refresh_token(self, db: Session, refresh_token: str) -> Optional[Tuple[str, str]]:
        """
        Aktualisiert das Access-Token anhand eines gültigen Refresh-Tokens
        """
        try:
            # Token decodieren und validieren
            payload = decode_token(refresh_token)
            user_id = payload.get("sub")
            token_type = payload.get("type")
            
            # Prüfen, ob das Token ein Refresh-Token ist
            if token_type != "refresh":
                return None
            
            # Prüfen, ob das Token auf der Blacklist steht
            blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token == refresh_token).first()
            if blacklisted:
                return None
            
            # Benutzer in der Datenbank suchen
            user = user_service.get_user_by_id(db, user_id)
            if not user or not user.is_active:
                return None
            
            # Neues Access-Token und Refresh-Token erstellen
            new_access_token = create_access_token(user.id)
            new_refresh_token = create_refresh_token(user.id)
            
            # Altes Refresh-Token auf die Blacklist setzen
            self.blacklist_token(db, refresh_token, payload.get("exp"))
            
            return new_access_token, new_refresh_token
        
        except Exception:
            return None
    
    def blacklist_token(
        self, db: Session, token: str, expires_at: Optional[datetime] = None
    ) -> TokenBlacklist:
        """
        Setzt ein Token auf die Blacklist
        """
        if expires_at is None:
            try:
                payload = decode_token(token)
                expires_at = datetime.fromtimestamp(payload.get("exp"))
            except Exception:
                # Wenn das Token nicht decodiert werden kann, setzen wir ein Ablaufdatum in der Zukunft
                expires_at = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        token_blacklist = TokenBlacklist(
            id=str(uuid4()),
            token=token,
            expires_at=expires_at,
            blacklisted_at=datetime.utcnow()
        )
        
        db.add(token_blacklist)
        db.commit()
        db.refresh(token_blacklist)
        
        return token_blacklist
    
    def logout(self, db: Session, token: str) -> bool:
        """
        Meldet einen Benutzer ab und setzt das Token auf die Blacklist
        """
        try:
            self.blacklist_token(db, token)
            return True
        except Exception:
            return False
    
    def generate_password_reset_token(self, db: Session, email: str) -> Optional[str]:
        """
        Generiert ein Token für das Zurücksetzen des Passworts
        """
        user = user_service.get_user_by_email(db, email)
        if not user:
            return None
        
        # Zufälliges Token generieren
        alphabet = string.ascii_letters + string.digits
        reset_token = ''.join(secrets.choice(alphabet) for _ in range(40))
        
        # Token und Ablaufdatum speichern
        user.password_reset_token = reset_token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=24)
        db.commit()
        
        return reset_token
    
    def reset_password(
        self, db: Session, reset_token: str, new_password: str
    ) -> Optional[User]:
        """
        Setzt das Passwort eines Benutzers zurück
        """
        # Benutzer mit dem Reset-Token suchen
        user = db.query(User).filter(
            User.password_reset_token == reset_token,
            User.password_reset_expires > datetime.utcnow()
        ).first()
        
        if not user:
            return None
        
        # Passwort aktualisieren
        user.hashed_password = get_password_hash(new_password)
        user.password_reset_token = None
        user.password_reset_expires = None
        db.commit()
        db.refresh(user)
        
        return user


# Singleton-Instanz
auth_service = AuthService() 