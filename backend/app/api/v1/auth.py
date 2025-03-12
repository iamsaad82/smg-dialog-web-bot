from fastapi import APIRouter, Depends, HTTPException, status, Response, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr

from ...core.deps import get_current_user
from ...db.session import get_db
from ...models.user import User
from ...services.auth_service import auth_service
from ...services.user_service import user_service
from ...utils.logger import logger


# Pydantic-Modelle für die Request-/Response-Validierung
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class RefreshToken(BaseModel):
    refresh_token: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: str
    role: str
    is_active: bool

    class Config:
        orm_mode = True


# Router für Authentifizierungsendpunkte
router = APIRouter(tags=["Authentifizierung"])


@router.post("/login", response_model=Dict[str, Any])
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authentifiziert einen Benutzer und gibt Access- und Refresh-Tokens zurück
    """
    auth_result = auth_service.authenticate(db, form_data.username, form_data.password)
    if not auth_result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger Benutzername oder Passwort",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user, access_token, refresh_token = auth_result
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "is_active": user.is_active,
        }
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token_data: RefreshToken,
    db: Session = Depends(get_db)
):
    """
    Aktualisiert das Access-Token anhand eines gültigen Refresh-Tokens
    """
    tokens = auth_service.refresh_token(db, refresh_token_data.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiges oder abgelaufenes Refresh-Token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token, refresh_token = tokens
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    token: str = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Meldet einen Benutzer ab und invalidiert das Token
    """
    success = auth_service.logout(db, token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Fehler beim Abmelden",
        )
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reset-password", status_code=status.HTTP_204_NO_CONTENT)
async def request_password_reset(
    reset_request: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """
    Sendet eine E-Mail mit einem Token zum Zurücksetzen des Passworts
    """
    token = auth_service.generate_password_reset_token(db, reset_request.email)
    
    # E-Mail mit dem Token senden
    if token:
        user = user_service.get_user_by_email(db, reset_request.email)
        if user:
            from ..services.email_service import email_service
            email_sent = email_service.send_password_reset_email(
                email=reset_request.email,
                reset_token=token,
                username=user.username
            )
            
            if not email_sent:
                # Falls der E-Mail-Versand fehlschlägt, loggen wir das, aber geben
                # aus Sicherheitsgründen keine Fehlermeldung zurück
                logger.error(f"Fehler beim Senden der Passwort-Reset-E-Mail an {reset_request.email}")
                # Für Entwicklungszwecke geben wir das Token in der Konsole aus
                print(f"Password reset token for {reset_request.email}: {token}")
        else:
            # Der Benutzer existiert nicht, aber wir loggen das nur
            logger.info(f"Passwort-Reset angefordert für nicht existierenden Benutzer: {reset_request.email}")
    
    # Aus Sicherheitsgründen geben wir immer 204 zurück, auch wenn der Benutzer nicht existiert
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/reset-password-confirm", response_model=UserResponse)
async def confirm_password_reset(
    reset_confirm: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Setzt das Passwort eines Benutzers zurück
    """
    user = auth_service.reset_password(db, reset_confirm.token, reset_confirm.new_password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ungültiges oder abgelaufenes Token",
        )
    
    return user


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """
    Gibt Informationen über den aktuellen Benutzer zurück
    """
    return current_user 