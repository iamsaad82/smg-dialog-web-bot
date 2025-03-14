from fastapi import Depends, HTTPException, Security, status, Request
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
from ..services.tenant_service import tenant_service
from ..core.config import settings
from ..db.session import get_db
import os

# Header für API-Key
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# OAuth2-Schema für JWT-Token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# Password-Hashing-Kontext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT-Konfiguration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "temporaerer_geheimer_schluessel")  # In der Produktion durch sichere Umgebungsvariable ersetzen
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7


# Passwort-Funktionen
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Überprüft, ob das eingegebene Passwort mit dem Hash übereinstimmt.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Erstellt einen Hash aus dem angegebenen Passwort.
    """
    return pwd_context.hash(password)


# JWT-Token-Funktionen
def create_jwt_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Erstellt ein JWT-Token mit den angegebenen Daten und Ablaufzeit.
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_access_token(user_id: str) -> str:
    """
    Erstellt ein kurzlebiges Access-Token für den angegebenen Benutzer.
    """
    return create_jwt_token(
        data={"sub": user_id, "type": "access"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )


def create_refresh_token(user_id: str) -> str:
    """
    Erstellt ein langlebiges Refresh-Token für den angegebenen Benutzer.
    """
    return create_jwt_token(
        data={"sub": user_id, "type": "refresh"},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodiert und verifiziert ein JWT-Token.
    Wirft eine JWTError, wenn das Token ungültig ist.
    """
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])


# Benutzerauthentifizierung mit JWT
async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Any:
    """
    Authentifiziert einen Benutzer anhand des JWT-Tokens und gibt den Benutzer zurück.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Ungültige Anmeldeinformationen",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        token_type = payload.get("type")
        
        if user_id is None or token_type != "access":
            raise credentials_exception
        
        # Hier müsste der Benutzer aus der Datenbank geholt werden
        # In diesem Beispiel nehmen wir an, dass ein User-Modell existiert
        from ..db.models import UserModel
        
        user = db.query(UserModel).filter(UserModel.id == user_id).first()
        if user is None:
            raise credentials_exception
            
        return user
    except JWTError:
        raise credentials_exception


# API-Key-Funktionen
async def get_tenant_id_from_api_key(
    request: Request,
    api_key_header: Optional[str] = Security(API_KEY_HEADER),
    db: Session = Depends(get_db)
) -> str:
    """
    Überprüft den API-Key und gibt die entsprechende Tenant-ID zurück.
    Prüft zuerst den Header, dann den Query-Parameter.
    Wirft eine HTTPException, wenn der API-Key ungültig ist.
    """
    # Zuerst Header-API-Key prüfen
    api_key = api_key_header
    
    # Wenn kein Header-API-Key, dann Query-Parameter prüfen
    if not api_key:
        api_key = request.query_params.get("api_key")
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API-Key nicht angegeben"
        )
    
    tenant_id = tenant_service.verify_api_key(db, api_key)
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ungültiger API-Key"
        )
    return tenant_id


# Alternative Authentifizierung über Query-Parameter für Einbettungen
async def get_tenant_id_from_query(
    api_key: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Optional[str]:
    """
    Überprüft den API-Key aus einem Query-Parameter und gibt die entsprechende Tenant-ID zurück.
    Gibt None zurück, wenn kein API-Key angegeben wurde oder der API-Key ungültig ist.
    """
    if not api_key:
        return None
    
    return tenant_service.verify_api_key(db, api_key)


# Admin-Authentifizierung für Verwaltungsfunktionen
async def get_admin_api_key(
    request: Request,
    api_key_header: Optional[str] = Security(API_KEY_HEADER)
) -> str:
    """
    Überprüft, ob der API-Key gültig und für Admin-Funktionen berechtigt ist.
    """
    # Zuerst Header-API-Key prüfen
    api_key = api_key_header
    
    # Wenn kein Header-API-Key, dann Query-Parameter prüfen
    if not api_key:
        api_key = request.query_params.get("api_key")
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin-API-Key nicht angegeben"
        )
    
    # Admin-API-Key aus Umgebungsvariablen holen
    admin_api_key = os.getenv("ADMIN_API_KEY", "")
    
    # Prüfen, ob der API-Key mit dem Admin-Key übereinstimmt
    if admin_api_key and api_key == admin_api_key:
        return api_key
    
    # Im Entwicklungsmodus akzeptieren wir jeden API-Key, wenn kein ADMIN_API_KEY gesetzt ist
    if not admin_api_key:
        return api_key
    
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Nicht autorisiert für Admin-Funktionen"
    ) 