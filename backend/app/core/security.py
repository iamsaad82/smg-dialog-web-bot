from fastapi import Depends, HTTPException, Security, status, Request
from fastapi.security import APIKeyHeader, OAuth2PasswordBearer
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
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
    # Import innerhalb der Funktion, um zirkuläre Importe zu vermeiden
    from ..services.tenant_service import tenant_service
    
    try:
        # DEBUG-Informationen drucken
        print(f"[get_tenant_id_from_api_key] Request-Methode: {request.method}")
        print(f"[get_tenant_id_from_api_key] Request-URL: {request.url}")
        print(f"[get_tenant_id_from_api_key] API-Key-Header: {api_key_header}")
        print(f"[get_tenant_id_from_api_key] ENV: {settings.ENV}")
        
        # Zuerst Header-API-Key prüfen
        api_key = api_key_header
        
        # Wenn kein Header-API-Key, dann Query-Parameter prüfen
        if not api_key:
            api_key = request.query_params.get("api_key")
            print(f"[get_tenant_id_from_api_key] API-Key aus Query: {api_key}")
        
        # Direkte Überprüfung auf Admin-API-Key - wichtig, um den Admin-API-Key zu erkennen, bevor tenant_service.verify_api_key aufgerufen wird
        if api_key and api_key == settings.ADMIN_API_KEY:
            print(f"[get_tenant_id_from_api_key] Admin-API-Key erkannt: {api_key == settings.ADMIN_API_KEY}")
            
            # Extrahiere tenant_id aus dem Pfad für Admin-API-Key
            path_parts = str(request.url.path).split('/')
            for i, part in enumerate(path_parts):
                if part == 'tenants' and i+1 < len(path_parts) and path_parts[i+1] != 'current':
                    tenant_id_from_path = path_parts[i+1]
                    if tenant_id_from_path and tenant_id_from_path != "current" and tenant_id_from_path != "ui-components-definitions":
                        # Prüfen, ob dieser Tenant existiert
                        tenant = tenant_service.get_tenant_by_id(db, tenant_id_from_path)
                        if tenant:
                            print(f"[get_tenant_id_from_api_key] Admin-API-Key verwendet für Tenant-ID {tenant_id_from_path}")
                            return tenant_id_from_path
                        else:
                            print(f"[get_tenant_id_from_api_key] Tenant mit ID {tenant_id_from_path} existiert nicht")
            
            # Wenn keine Tenant-ID im Pfad gefunden, verwenden wir einen Standard-Tenant
            # oder den ersten verfügbaren Tenant aus der Datenbank
            tenants = tenant_service.get_all_tenants(db)
            if tenants and len(tenants) > 0:
                print(f"[get_tenant_id_from_api_key] Admin-API-Key: Verwende ersten Tenant: {tenants[0].id}")
                return tenants[0].id
            
            print(f"[get_tenant_id_from_api_key] WARNUNG: Keine Tenants in der Datenbank gefunden!")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Keine Tenants verfügbar"
            )

        # Fallback für Entwicklungsumgebung - extrahiere tenant_id aus dem Pfad
        if settings.ENV == "dev":
            print(f"[get_tenant_id_from_api_key] ENTWICKLUNGSMODUS: Tenant-ID aus Pfad extrahieren")
            # Extrahiere tenant_id aus dem Pfad
            path_parts = str(request.url.path).split('/')
            for i, part in enumerate(path_parts):
                if part == 'tenants' and i+1 < len(path_parts) and path_parts[i+1] != 'current':
                    tenant_id_from_path = path_parts[i+1]
                    print(f"[get_tenant_id_from_api_key] ENTWICKLUNGSMODUS - Tenant-ID aus Pfad: {tenant_id_from_path}")
                    if tenant_id_from_path and tenant_id_from_path != "current" and tenant_id_from_path != "ui-components-definitions":
                        # Prüfen, ob dieser Tenant existiert
                        tenant = tenant_service.get_tenant_by_id(db, tenant_id_from_path)
                        if tenant:
                            print(f"[get_tenant_id_from_api_key] Development-Bypass: Verwende Tenant-ID {tenant_id_from_path}")
                            return tenant_id_from_path
                        else:
                            print(f"[get_tenant_id_from_api_key] Tenant mit ID {tenant_id_from_path} existiert nicht in der Datenbank")
        
        if not api_key:
            print("[get_tenant_id_from_api_key] Kein API-Key gefunden.")
            # Im Entwicklungsmodus, einen Dummy-Tenant verwenden
            if settings.ENV == "dev":
                print("[get_tenant_id_from_api_key] DEV-MODE: Dummy-Tenant für Entwicklung verwenden")
                
                # Extrahiere tenant_id aus dem Pfad
                path_parts = str(request.url.path).split('/')
                for i, part in enumerate(path_parts):
                    if part == 'tenants' and i+1 < len(path_parts) and path_parts[i+1] != 'current':
                        tenant_id_from_path = path_parts[i+1]
                        if tenant_id_from_path and tenant_id_from_path != "current" and tenant_id_from_path != "ui-components-definitions":
                            tenant = tenant_service.get_tenant_by_id(db, tenant_id_from_path)
                            if tenant:
                                print(f"[get_tenant_id_from_api_key] DEV-MODE: Verwendung von Tenant-ID {tenant_id_from_path} ohne API-Key")
                                return tenant_id_from_path
                
                # Wenn keine Tenant-ID im Pfad oder die Tenant-ID existiert nicht, verwenden wir alle Tenants
                tenants = tenant_service.get_all_tenants(db)
                if tenants and len(tenants) > 0:
                    print(f"[get_tenant_id_from_api_key] DEV-MODE: Verwende ersten Tenant: {tenants[0].id}")
                    return tenants[0].id
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API-Key nicht angegeben"
            )
        
        # Verifizieren des API-Keys über den tenant_service
        tenant_id = tenant_service.verify_api_key(db, api_key)
        print(f"[get_tenant_id_from_api_key] Verifizierter Tenant: {tenant_id}")
        
        if not tenant_id:
            print("[get_tenant_id_from_api_key] Ungültiger API-Key.")
            # Im Entwicklungsmodus, einen Dummy-Tenant verwenden
            if settings.ENV == "dev":
                print("[get_tenant_id_from_api_key] DEV-MODE: Dummy-Tenant für Entwicklung verwenden")
                
                # Extrahiere tenant_id aus dem Pfad
                path_parts = str(request.url.path).split('/')
                for i, part in enumerate(path_parts):
                    if part == 'tenants' and i+1 < len(path_parts) and path_parts[i+1] != 'current':
                        tenant_id_from_path = path_parts[i+1]
                        if tenant_id_from_path and tenant_id_from_path != "current" and tenant_id_from_path != "ui-components-definitions":
                            tenant = tenant_service.get_tenant_by_id(db, tenant_id_from_path)
                            if tenant:
                                print(f"[get_tenant_id_from_api_key] DEV-MODE: Verwendung von Tenant-ID {tenant_id_from_path} trotz ungültigem API-Key")
                                return tenant_id_from_path
                
                # Wenn keine Tenant-ID im Pfad oder die Tenant-ID existiert nicht, verwenden wir alle Tenants
                tenants = tenant_service.get_all_tenants(db)
                if tenants and len(tenants) > 0:
                    print(f"[get_tenant_id_from_api_key] DEV-MODE: Verwende ersten Tenant: {tenants[0].id}")
                    return tenants[0].id
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Ungültiger API-Key"
            )
        return tenant_id
    except HTTPException as he:
        # HTTPException direkt weiterleiten
        raise he
    except Exception as e:
        error_msg = f"Unerwarteter Fehler bei der API-Key-Authentifizierung: {str(e)}"
        print(f"[get_tenant_id_from_api_key] FEHLER: {error_msg}")
        import traceback
        print(f"[get_tenant_id_from_api_key] Stacktrace: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_msg
        )


# Alternative Authentifizierung über Query-Parameter für Einbettungen
async def get_tenant_id_from_query(
    request: Request,
    api_key_header: Optional[str] = Security(API_KEY_HEADER),
    db: Session = Depends(get_db)
) -> Optional[str]:
    """
    Überprüft den API-Key aus einem Query-Parameter und gibt die entsprechende Tenant-ID zurück.
    Gibt None zurück, wenn kein API-Key angegeben wurde oder der API-Key ungültig ist.
    """
    # Import innerhalb der Funktion, um zirkuläre Importe zu vermeiden
    from ..services.tenant_service import tenant_service
    
    try:
        print(f"[get_tenant_id_from_query] API-Key-Header: {api_key_header}")
        
        # Extrahiere tenant_id aus dem Pfad
        path_parts = str(request.url.path).split('/')
        for i, part in enumerate(path_parts):
            if part == 'tenants' and i+1 < len(path_parts) and path_parts[i+1] != 'current':
                tenant_id_from_path = path_parts[i+1]
                print(f"[get_tenant_id_from_query] ENTWICKLUNGSMODUS - Tenant-ID aus Pfad: {tenant_id_from_path}")
                if tenant_id_from_path and tenant_id_from_path != "current" and tenant_id_from_path != "ui-components-definitions":
                    # Prüfen, ob dieser Tenant existiert
                    tenant = tenant_service.get_tenant_by_id(db, tenant_id_from_path)
                    if tenant:
                        print(f"[get_tenant_id_from_query] Development-Bypass: Verwende Tenant-ID {tenant_id_from_path}")
                        return tenant_id_from_path
        
        # Zuerst den API-Key aus dem Header verwenden
        api_key = api_key_header
        
        # Wenn kein Header-API-Key, dann aus Query-Parametern holen
        if not api_key:
            api_key = request.query_params.get("api_key")
            print(f"[get_tenant_id_from_query] API-Key aus Query: {api_key}")
        
        if not api_key:
            print("[get_tenant_id_from_query] Kein API-Key gefunden.")
            return None
        
        # Direkter Check auf Admin-API-Key
        if api_key == settings.ADMIN_API_KEY:
            print("[get_tenant_id_from_query] Admin-API-Key erkannt")
            
            # Extrahiere tenant_id aus dem Pfad für Admin-API-Key
            path_parts = str(request.url.path).split('/')
            for i, part in enumerate(path_parts):
                if part == 'tenants' and i+1 < len(path_parts) and path_parts[i+1] != 'current':
                    tenant_id_from_path = path_parts[i+1]
                    if tenant_id_from_path and tenant_id_from_path != "current":
                        # Prüfen, ob dieser Tenant existiert
                        tenant = tenant_service.get_tenant_by_id(db, tenant_id_from_path)
                        if tenant:
                            print(f"[get_tenant_id_from_query] Admin-API-Key verwendet für Tenant-ID {tenant_id_from_path}")
                            return tenant_id_from_path
            
            # Wenn keine Tenant-ID im Pfad, ersten verfügbaren Tenant verwenden
            tenants = tenant_service.get_all_tenants(db)
            if tenants and len(tenants) > 0:
                print(f"[get_tenant_id_from_query] Admin-API-Key: Verwende ersten Tenant: {tenants[0].id}")
                return tenants[0].id
        
        # Reguläre API-Key-Verifizierung
        tenant_id = tenant_service.verify_api_key(db, api_key)
        print(f"[get_tenant_id_from_query] Verifizierter Tenant: {tenant_id}")
        return tenant_id
        
    except Exception as e:
        import traceback
        print(f"[get_tenant_id_from_query] Fehler: {str(e)}")
        print(f"[get_tenant_id_from_query] Stacktrace: {traceback.format_exc()}")
        return None


# Admin-Authentifizierung für Verwaltungsfunktionen
async def get_admin_api_key(
    request: Request,
    api_key_header: Optional[str] = Security(API_KEY_HEADER)
) -> str:
    """
    Überprüft, ob der API-Key der Admin-API-Key ist.
    Wirft eine HTTPException, wenn der API-Key nicht angegeben oder nicht der Admin-API-Key ist.
    """
    # Import innerhalb der Funktion, um zirkuläre Importe zu vermeiden
    from ..services.tenant_service import tenant_service
    
    try:
        # Debug-Ausgabe
        print(f"[get_admin_api_key] Request-Methode: {request.method}")
        print(f"[get_admin_api_key] Request-URL: {request.url}")
        print(f"[get_admin_api_key] API-Key-Header: {api_key_header}")
        print(f"[get_admin_api_key] ENV: {settings.ENV}")
        
        # Zuerst Header-API-Key prüfen
        api_key = api_key_header
        
        # Wenn kein Header-API-Key, dann Query-Parameter prüfen
        if not api_key:
            api_key = request.query_params.get("api_key")
            print(f"[get_admin_api_key] API-Key aus Query: {api_key}")
        
        if not api_key:
            print("[get_admin_api_key] Kein API-Key gefunden.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Admin-API-Key nicht angegeben"
            )
        
        # Admin-API-Key aus den Einstellungen holen
        admin_api_key = settings.ADMIN_API_KEY
        print(f"[get_admin_api_key] Admin-API-Key aus Einstellungen: {admin_api_key}")
        
        # Prüfen, ob der API-Key mit dem Admin-Key übereinstimmt
        if admin_api_key and api_key == admin_api_key:
            print("[get_admin_api_key] API-Key stimmt mit Admin-Key überein")
            return api_key
        
        # Im Entwicklungsmodus akzeptieren wir jeden API-Key
        if settings.ENV == "dev":
            print("[get_admin_api_key] DEV-Modus: Akzeptiere jeden API-Key")
            return api_key
        
        print("[get_admin_api_key] API-Key nicht autorisiert für Admin-Funktionen")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Nicht autorisiert für Admin-Funktionen"
        )
    except Exception as e:
        import traceback
        print(f"[get_admin_api_key] Fehler: {str(e)}")
        print(f"[get_admin_api_key] Stacktrace: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Interner Serverfehler"
        ) 