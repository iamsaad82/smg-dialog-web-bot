from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import uuid4

from ..models.user import User, UserRole, UserCreate
from ..core.security import get_password_hash, verify_password


class UserService:
    """
    Service-Klasse für die Verwaltung von Benutzern
    """
    
    def get_user_by_id(self, db: Session, user_id: str) -> Optional[User]:
        """
        Gibt einen Benutzer anhand seiner ID zurück
        """
        return db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, db: Session, email: str) -> Optional[User]:
        """
        Gibt einen Benutzer anhand seiner E-Mail-Adresse zurück
        """
        return db.query(User).filter(User.email == email).first()
    
    def get_all_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """
        Gibt eine Liste aller Benutzer zurück
        """
        return db.query(User).offset(skip).limit(limit).all()
    
    def get_users_by_agency(self, db: Session, agency_id: str) -> List[User]:
        """
        Gibt eine Liste aller Benutzer einer Agentur zurück
        """
        return db.query(User).filter(User.agency_id == agency_id).all()
    
    def authenticate_user(self, db: Session, email: str, password: str) -> Optional[User]:
        """
        Authentifiziert einen Benutzer anhand seiner E-Mail-Adresse und Passworts
        """
        user = self.get_user_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user
    
    def create_user(
        self, db: Session, user_create: UserCreate, created_by_id: Optional[str] = None
    ) -> User:
        """
        Erstellt einen neuen Benutzer
        """
        # Überprüfen, ob die E-Mail-Adresse bereits existiert
        if user_create.email:
            existing_email = db.query(User).filter(User.email == user_create.email).first()
            if existing_email:
                raise ValueError(f"E-Mail-Adresse '{user_create.email}' wird bereits verwendet")
        
        # Neuen Benutzer erstellen
        db_user = User(
            id=str(uuid4()),
            email=user_create.email,
            hashed_password=get_password_hash(user_create.password),
            full_name=user_create.full_name,
            role=user_create.role,
            is_active=user_create.is_active,
            agency_id=user_create.agency_id
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Willkommens-E-Mail senden, wenn E-Mail-Adresse vorhanden
        if db_user.email:
            try:
                from .email_service import email_service
                email_service.send_welcome_email(
                    email=db_user.email,
                    name=db_user.full_name,
                    password=user_create.password if not user_create.is_temporary_password else None
                )
            except Exception as e:
                # E-Mail-Versand ist nicht kritisch für die Benutzerregistrierung
                from ..utils.logger import logger
                logger.error(f"Fehler beim Senden der Willkommens-E-Mail an {db_user.email}: {str(e)}")
        
        return db_user
    
    def update_user(
        self,
        db: Session,
        user_id: str,
        email: Optional[str] = None,
        password: Optional[str] = None,
        full_name: Optional[str] = None,
        role: Optional[UserRole] = None,
        agency_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> Optional[User]:
        """
        Aktualisiert die Daten eines Benutzers
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            return None

        # Aktualisieren der Benutzerdaten, falls neue Werte übergeben wurden
        if email is not None and email != user.email:
            # Überprüfen, ob die neue E-Mail-Adresse bereits existiert
            existing_email = db.query(User).filter(User.email == email).first()
            if existing_email and existing_email.id != user_id:
                raise ValueError(f"E-Mail-Adresse '{email}' wird bereits verwendet")
            user.email = email

        if password is not None:
            user.hashed_password = get_password_hash(password)

        if full_name is not None:
            user.full_name = full_name

        if role is not None:
            user.role = role

        if agency_id is not None:
            user.agency_id = agency_id

        if is_active is not None:
            user.is_active = is_active

        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    
    def delete_user(self, db: Session, user_id: str) -> bool:
        """
        Löscht einen Benutzer
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            return False
        
        db.delete(user)
        db.commit()
        return True
    
    def update_last_login(self, db: Session, user_id: str) -> Optional[User]:
        """
        Aktualisiert den letzten Login-Zeitpunkt eines Benutzers
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            return None
        
        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        return user
    
    def assign_tenant_to_user(self, db: Session, user_id: str, tenant_id: str) -> Optional[User]:
        """
        Weist einem Benutzer einen Tenant zu
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            return None
        
        # Prüfen, ob der Tenant bereits zugewiesen ist
        for tenant in user.assigned_tenants:
            if tenant.id == tenant_id:
                return user
        
        # Tenant aus der Datenbank abrufen
        from ..models import Tenant
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if not tenant:
            return None
        
        # Tenant dem Benutzer zuweisen
        user.assigned_tenants.append(tenant)
        db.commit()
        db.refresh(user)
        return user
    
    def remove_tenant_from_user(self, db: Session, user_id: str, tenant_id: str) -> Optional[User]:
        """
        Entfernt einen Tenant von einem Benutzer
        """
        user = self.get_user_by_id(db, user_id)
        if not user:
            return None
        
        # Tenant aus der Liste der zugewiesenen Tenants entfernen
        user.assigned_tenants = [tenant for tenant in user.assigned_tenants if tenant.id != tenant_id]
        db.commit()
        db.refresh(user)
        return user


# Singleton-Instanz
user_service = UserService() 