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
    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        logger.info(f"Ein Admin-Benutzer existiert bereits ({existing_admin.email}). Kein neuer Superuser erstellt.")
        return False
    
    # Prüfen, ob ein Benutzer mit der angegebenen E-Mail existiert
    existing_user = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    
    if existing_user:
        logger.warning(
            f"Ein Benutzer mit der E-Mail '{settings.FIRST_SUPERUSER_EMAIL}' existiert bereits. " 
            f"Kein neuer Superuser erstellt."
        )
        return False
    
    # Superuser erstellen
    try:
        logger.info(f"Erstelle initialen Superuser mit E-Mail '{settings.FIRST_SUPERUSER_EMAIL}'...")
        
        # Vollständigen Namen zusammensetzen
        full_name = f"{settings.FIRST_SUPERUSER_FIRSTNAME} {settings.FIRST_SUPERUSER_LASTNAME}".strip()
        
        superuser = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            full_name=full_name,
            role="admin",
            is_active=True
        )
        
        db.add(superuser)
        db.commit()
        
        logger.info(f"Superuser mit E-Mail '{settings.FIRST_SUPERUSER_EMAIL}' wurde erfolgreich erstellt!")
        return True
        
    except Exception as e:
        db.rollback()
        logger.error(f"Fehler bei der Erstellung des Superusers: {e}")
        return False 