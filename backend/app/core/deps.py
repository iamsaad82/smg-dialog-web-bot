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
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Extrahiert und validiert den JWT-Token aus dem Authorization-Header.
    Gibt den aktuellen Benutzer zurück, wenn der Token gültig ist.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nicht authentifiziert",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Prüfen, ob das Token auf der Blacklist steht
    blacklisted = db.query(TokenBlacklist).filter(TokenBlacklist.token == token).first()
    if blacklisted:
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
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültiger Token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if token_type != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Falscher Token-Typ",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token konnte nicht validiert werden",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = user_service.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Benutzer nicht gefunden",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Benutzer ist inaktiv",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Gibt den aktuellen Benutzer zurück, wenn er aktiv ist.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inaktiver Benutzer",
        )
    return current_user


def get_current_user_with_roles(required_roles: List[UserRole]) -> callable:
    """
    Factory-Funktion, die eine Dependency-Funktion zurückgibt, die prüft, ob
    der aktuelle Benutzer eine der erforderlichen Rollen hat.
    """
    async def current_user_with_roles(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in required_roles:
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