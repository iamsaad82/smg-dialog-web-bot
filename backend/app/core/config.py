from typing import List, Optional
import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "KI-Bot-System"
    
    # Umgebung (dev, stage, prod)
    ENV: str = os.getenv("ENV", "dev")  # Standard ist "dev" für Entwicklungsumgebung
    
    # Speicherpfade
    DATA_DIR: str = os.getenv("DATA_DIR", "/app/data")

    # Secrets
    SECRET_KEY: str = os.getenv("SECRET_KEY", "default_secret_key_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Automatischer Admin-Benutzer
    FIRST_SUPERUSER_USERNAME: str = os.getenv("FIRST_SUPERUSER_USERNAME", "admin")
    FIRST_SUPERUSER_EMAIL: str = os.getenv("FIRST_SUPERUSER_EMAIL", "admin@example.com")
    FIRST_SUPERUSER_PASSWORD: str = os.getenv("FIRST_SUPERUSER_PASSWORD", "")
    FIRST_SUPERUSER_FIRSTNAME: str = os.getenv("FIRST_SUPERUSER_FIRSTNAME", "Admin")
    FIRST_SUPERUSER_LASTNAME: str = os.getenv("FIRST_SUPERUSER_LASTNAME", "User")
    AUTO_CREATE_SUPERUSER: bool = os.getenv("AUTO_CREATE_SUPERUSER", "False").lower() == "true"

    # Weaviate
    WEAVIATE_URL: str = os.getenv("WEAVIATE_URL", "http://localhost:8080")
    WEAVIATE_API_KEY: Optional[str] = os.getenv("WEAVIATE_API_KEY")

    # LLM Config
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4-turbo")
    
    # Optional: Mistral
    MISTRAL_API_KEY: str = os.getenv("MISTRAL_API_KEY", "")
    MISTRAL_MODEL: str = os.getenv("MISTRAL_MODEL", "mistral-medium")

    # Datenbank für Kundenverwaltung
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    # PostgreSQL Einstellungen
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "db")  # Container-Name aus docker-compose
    POSTGRES_HOST: str = os.getenv("POSTGRES_SERVER", "db")  # Alias für POSTGRES_SERVER für Kompatibilität
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "smg_dialog")
    SQLALCHEMY_DATABASE_URI: Optional[str] = None

    # CORS-Konfiguration
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",     # Frontend Dev-Server
        "http://localhost",          # Frontend Prod
        "http://localhost:8080",     # Alternative Frontend
        "https://smg-dialog-web-bot.onrender.com",  # Render Frontend
    ]

    # Nur für Entwicklung
    ADMIN_API_KEY: str = "admin-secret-key-12345"

    def __init__(self, **data):
        super().__init__(**data)
        
        # Datenbank-URI zusammenbauen
        if self.DATABASE_URL:
            self.SQLALCHEMY_DATABASE_URI = self.DATABASE_URL
        else:
            # Verwende POSTGRES_HOST (alias für POSTGRES_SERVER) für Kompatibilität
            self.SQLALCHEMY_DATABASE_URI = (
                f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
                f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
            )

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
