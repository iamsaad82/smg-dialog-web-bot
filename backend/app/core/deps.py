from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from typing import Optional, List

from .security import oauth2_scheme, JWT_SECRET_KEY, JWT_ALGORITHM, decode_token
from ..db.session import get_db
from ..models.user import User, UserRole
from ..models.token import TokenBlacklist
from ..services.user_service import user_service


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Extrahiert und validiert den JWT-Token aus dem Authorization-Header.
    Gibt den aktuellen Benutzer zurück, wenn der Token gültig ist.
    Im Entwicklungsmodus kann die Funktion None zurückgeben, wenn kein Token vorhanden ist.
    """
    # Import der Umgebungsvariablen
    import os
    from .config import settings
    
    # Im Entwicklungsmodus kann die Authentifizierung optional sein
    if not token:
        if os.getenv("ENV", "dev") == "dev":
            print("[get_current_user] DEV-MODUS: Kein Token vorhanden, überspringe Authentifizierung")
            return None
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nicht authentifiziert",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Prüfen, ob das Token auf der Blacklist steht
    blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token == token).first()
    if blacklisted:
        if os.getenv("ENV", "dev") == "dev":
            print("[get_current_user] DEV-MODUS: Token auf Blacklist, überspringe Authentifizierung")
            return None
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token ist ungültig oder abgelaufen",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if user_id is None:
            if os.getenv("ENV", "dev") == "dev":
                print("[get_current_user] DEV-MODUS: Ungültiger Token, überspringe Authentifizierung")
                return None
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Ungültiger Token",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        
        if token_type != "access":
            if os.getenv("ENV", "dev") == "dev":
                print("[get_current_user] DEV-MODUS: Falscher Token-Typ, überspringe Authentifizierung")
                return None
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Falscher Token-Typ",
                    headers={"WWW-Authenticate": "Bearer"},
                )
    except JWTError:
        if os.getenv("ENV", "dev") == "dev":
            print("[get_current_user] DEV-MODUS: JWTError bei Token-Validierung, überspringe Authentifizierung")
            return None
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token konnte nicht validiert werden",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        if os.getenv("ENV", "dev") == "dev":
            print("[get_current_user] DEV-MODUS: Benutzer nicht gefunden, überspringe Authentifizierung")
            return None
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Benutzer nicht gefunden",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    if not user.is_active:
        if os.getenv("ENV", "dev") == "dev":
            print("[get_current_user] DEV-MODUS: Benutzer ist inaktiv, überspringe Authentifizierung")
            return None
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Benutzer ist inaktiv",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    return user


async def get_current_active_user(
    current_user: Optional[User] = Depends(get_current_user)
) -> Optional[User]:
    """
    Gibt den aktuellen Benutzer zurück, wenn er aktiv ist.
    Im Entwicklungsmodus kann die Funktion None zurückgeben.
    """
    # Import der Umgebungsvariablen
    import os
    
    if current_user is None:
        if os.getenv("ENV", "dev") == "dev":
            print("[get_current_active_user] DEV-MODUS: Kein Benutzer, überspringe Authentifizierung")
            return None
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Nicht authentifiziert",
            )
    
    if not current_user.is_active:
        if os.getenv("ENV", "dev") == "dev":
            print("[get_current_active_user] DEV-MODUS: Benutzer ist inaktiv, überspringe Authentifizierung")
            return None
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Inaktiver Benutzer",
            )
    return current_user


def get_current_user_with_roles(required_roles: List[UserRole]) -> callable:
    """
    Factory-Funktion, die eine Dependency-Funktion zurückgibt, die prüft, ob
    der aktuelle Benutzer eine der erforderlichen Rollen hat.
    Im Entwicklungsmodus kann die Authentifizierung übersprungen werden.
    """
    async def current_user_with_roles(
        current_user: Optional[User] = Depends(get_current_active_user)
    ) -> Optional[User]:
        # Import der Umgebungsvariablen
        import os
        
        if current_user is None:
            if os.getenv("ENV", "dev") == "dev":
                print(f"[current_user_with_roles] DEV-MODUS: Kein Benutzer, überspringe Rollenprüfung für {required_roles}")
                # Im Entwicklungsmodus einen simulierten Admin-Benutzer zurückgeben
                from ...models.user import User, UserRole
                return User(id="dev-admin", username="dev-admin", role=UserRole.ADMIN, is_active=True)
            else:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Nicht authentifiziert",
                )
        
        if current_user.role not in required_roles:
            if os.getenv("ENV", "dev") == "dev":
                print(f"[current_user_with_roles] DEV-MODUS: Benutzer hat nicht die erforderlichen Rollen {required_roles}, überspringe Prüfung")
                # Im Entwicklungsmodus einen simulierten Admin-Benutzer zurückgeben
                from ...models.user import User, UserRole
                return User(id="dev-admin", username="dev-admin", role=UserRole.ADMIN, is_active=True)
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Unzureichende Berechtigungen. Benötigt eine der folgenden Rollen: {required_roles}",
                )
        return current_user
    return current_user_with_roles


# Vordefinierte Role-Checks
get_admin_user = get_current_user_with_roles([UserRole.ADMIN])
get_agency_admin_user = get_current_user_with_roles([UserRole.ADMIN, UserRole.AGENCY_ADMIN])
get_editor_user = get_current_user_with_roles([UserRole.ADMIN, UserRole.AGENCY_ADMIN, UserRole.EDITOR]) 