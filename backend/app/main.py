import logging
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy import text

# Importiere den API-Router direkt aus dem v1-Modul
from app.api.v1.api import api_router
from app.core.config import settings
from app.utils.init_superuser import create_initial_superuser
from app.db.session import SessionLocal, engine
from app.services.weaviate.schema_manager import SchemaManager
from app.services.weaviate.health_manager import HealthManager
from app.services.weaviate.client import close_client

# Logging konfigurieren
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI-App initialisieren
app = FastAPI(
    title=settings.PROJECT_NAME, 
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS-Middleware für Cross-Origin-Anfragen
# In der Produktionsumgebung sollten die Ursprünge eingeschränkt werden
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API-Router für Version 1 einbinden
app.include_router(api_router, prefix=settings.API_V1_STR)

# Startup-Event zur Validierung der Weaviate-Klassen
@app.on_event("startup")
async def validate_weaviate_classes():
    """
    Überprüft und validiert alle Weaviate-Klassen beim Anwendungsstart.
    """
    try:
        logger.info("Validiere Weaviate-Klassen beim Anwendungsstart...")
        # Standard-Schema erstellen, falls nicht vorhanden
        try:
            SchemaManager.create_standard_schema()
            # Tenant-Klassen validieren
            health_manager = HealthManager()
            checked, repaired = health_manager.validate_all_tenant_classes()
            logger.info(f"Weaviate-Klassen validiert: {checked} überprüft, {repaired} repariert")
        except Exception as schema_error:
            logger.warning(f"Weaviate-Schema-Erstellung/-Validierung fehlgeschlagen: {schema_error}")
            logger.warning("Weaviate-Funktionalität könnte eingeschränkt sein, aber die App wird trotzdem gestartet.")
    except Exception as e:
        logger.error(f"Fehler bei der Validierung des Weaviate-Schemas: {str(e)}")
        logger.warning("Die Anwendung wird trotz Fehler bei der Schema-Validierung gestartet.")

# Startup-Event zur Erstellung des Superusers
@app.on_event("startup")
async def create_first_superuser():
    """Erstellt einen Superuser beim Start der Anwendung, falls noch keiner existiert."""
    try:
        logger.info("Überprüfe, ob ein Admin-Benutzer existiert...")
        db = SessionLocal()
        # Prüfen, ob die Tabellen existieren
        try:
            result = db.execute(text("SELECT 1 FROM users LIMIT 1"))
            result.fetchall()
        except Exception as e:
            logger.warning(f"Tabellen existieren möglicherweise nicht. Fehler: {e}")
            logger.warning("Stelle sicher, dass Alembic-Migrationen korrekt ausgeführt wurden.")
            db.close()
            return
        
        create_initial_superuser(db)
        db.close()
    except Exception as e:
        logger.error(f"Fehler bei der Erstellung des Superusers: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """
    Ereignishandler für das Herunterfahren der Anwendung.
    Stellt sicher, dass alle Ressourcen ordnungsgemäß freigegeben werden.
    """
    logger.info("Anwendung wird heruntergefahren, Ressourcen werden freigegeben...")
    
    # Schließe Weaviate-Client
    try:
        close_client()
    except Exception as e:
        logger.error(f"Fehler beim Schließen des Weaviate-Clients: {str(e)}")
    
    # Schließe Datenbankverbindungen
    try:
        if engine:
            logger.info("Schließe Datenbankverbindungen...")
            engine.dispose()
            logger.info("Datenbankverbindungen erfolgreich geschlossen")
    except Exception as e:
        logger.error(f"Fehler beim Schließen der Datenbankverbindungen: {str(e)}")
    
    logger.info("Alle Ressourcen wurden erfolgreich freigegeben")

# Starten mit 'uvicorn app.main:app --reload'
if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 