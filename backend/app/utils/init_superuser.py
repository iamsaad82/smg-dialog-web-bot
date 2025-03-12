"""
Modul zur automatischen Erstellung eines Superuser-Benutzers beim Systemstart.
"""
import logging
from sqlalchemy.orm import Session
from ..models.user import User, UserRole
from ..core.config import settings
from ..core.security import get_password_hash

logger = logging.getLogger(__name__)

def create_initial_superuser(db: Session) -> bool:
    """
    Erstellt einen Superuser beim ersten Start der Anwendung, wenn keiner existiert.
    
    Args:
        db (Session): Datenbankverbindung
    
    Returns:
        bool: True, wenn ein neuer Superuser erstellt wurde, sonst False
    """
    if not settings.AUTO_CREATE_SUPERUSER:
        logger.info("Automatische Erstellung des Superusers ist deaktiviert.")
        return False
    
    if not settings.FIRST_SUPERUSER_PASSWORD:
        logger.warning("Kein Passwort für den Superuser definiert. Die automatische Erstellung wird übersprungen.")
        return False
    
    # Prüfen, ob bereits ein Admin-Benutzer existiert
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if existing_admin:
        logger.info(f"Ein Admin-Benutzer existiert bereits ({existing_admin.username}). Kein neuer Superuser erstellt.")
        return False
    
    # Prüfen, ob ein Benutzer mit dem angegebenen Benutzernamen oder der E-Mail existiert
    existing_user = db.query(User).filter(
        (User.username == settings.FIRST_SUPERUSER_USERNAME) | 
        (User.email == settings.FIRST_SUPERUSER_EMAIL)
    ).first()
    
    if existing_user:
        logger.warning(
            f"Ein Benutzer mit dem Benutzernamen '{settings.FIRST_SUPERUSER_USERNAME}' " 
            f"oder der E-Mail '{settings.FIRST_SUPERUSER_EMAIL}' existiert bereits. " 
            f"Kein neuer Superuser erstellt."
        )
        return False
    
    # Superuser erstellen
    try:
        logger.info(f"Erstelle initialen Superuser '{settings.FIRST_SUPERUSER_USERNAME}'...")
        
        superuser = User(
            username=settings.FIRST_SUPERUSER_USERNAME,
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            first_name=settings.FIRST_SUPERUSER_FIRSTNAME,
            last_name=settings.FIRST_SUPERUSER_LASTNAME,
            role=UserRole.ADMIN,
            is_active=True
        )
        
        db.add(superuser)
        db.commit()
        
        logger.info(f"Superuser '{settings.FIRST_SUPERUSER_USERNAME}' wurde erfolgreich erstellt!")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Fehler bei der Erstellung des Superusers: {e}")
        return False 