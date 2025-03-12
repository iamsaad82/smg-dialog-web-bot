from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import tenants, documents, chat, auth
from .core.config import settings
import os
import logging
import asyncio
from .db.session import SessionLocal

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # Ausgabe in die Konsole
    ]
)
# Detailliertes Logging für interaktive Elemente aktivieren
logging.getLogger('app.services.interactive').setLevel(logging.DEBUG)
logger = logging.getLogger(__name__)

# App erstellen
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Startup-Event zur Validierung der Weaviate-Klassen
@app.on_event("startup")
async def validate_weaviate_classes():
    """Validiert alle Tenant-Klassen in Weaviate beim Start der Anwendung."""
    logger.info("Validiere Weaviate-Klassen beim Anwendungsstart...")
    try:
        from app.services.weaviate.validate_classes import validate_all_tenant_classes
        checked, repaired = await validate_all_tenant_classes()
        logger.info(f"Weaviate-Klassenvalidierung abgeschlossen: {checked} Klassen geprüft, {repaired} Klassen repariert")
    except Exception as e:
        logger.error(f"Fehler bei der Validierung der Weaviate-Klassen: {e}")
        # Anwendung nicht beenden, auch wenn die Validierung fehlschlägt

# Startup-Event zur Erstellung des Superusers
@app.on_event("startup")
async def create_superuser():
    """Erstellt einen Superuser beim ersten Start der Anwendung, wenn keiner existiert."""
    logger.info("Überprüfe, ob ein Superuser erstellt werden muss...")
    try:
        from app.utils.init_superuser import create_initial_superuser
        
        # Datenbankverbindung erstellen
        db = SessionLocal()
        try:
            superuser_created = create_initial_superuser(db)
            if superuser_created:
                logger.info("Superuser erfolgreich erstellt!")
            else:
                logger.info("Kein Superuser erstellt.")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Fehler bei der Überprüfung/Erstellung des Superusers: {e}")
        # Anwendung nicht beenden, auch wenn die Superuser-Erstellung fehlschlägt

# CORS-Middleware hinzufügen
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://localhost:3001"
]

logger.info(f"Konfiguriere CORS mit Origins: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Statuspfad für Gesundheitschecks
@app.get("/api/health")
async def health_check():
    """Einfacher Endpunkt für Gesundheitschecks."""
    return {"status": "ok"}

# Authentifizierungs-Router
app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["auth"]
)

# API-Routen einbinden
app.include_router(
    tenants.router,
    prefix=f"{settings.API_V1_STR}/tenants",
    tags=["tenants"]
)

# Dokumente als Sub-Route unter Tenants
app.include_router(
    documents.router,
    prefix=f"{settings.API_V1_STR}/tenants/{{tenant_id}}/documents",
    tags=["documents"]
)

app.include_router(
    chat.router,
    prefix=f"{settings.API_V1_STR}/chat",
    tags=["chat"]
)

# Willkommensnachricht
@app.get("/")
async def root():
    """Root-Endpunkt mit Willkommensnachricht."""
    logger.info("Root-Endpunkt aufgerufen")
    return {
        "message": f"Willkommen zum {settings.PROJECT_NAME} API-Server",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

# Starten mit 'uvicorn app.main:app --reload'
if __name__ == "__main__":
    import uvicorn
    
    # Falls PORT als Umgebungsvariable gesetzt ist (z.B. bei Deployment)
    port = int(os.environ.get("PORT", 8000))
    
    logger.info(f"Server startet auf Port {port}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True) 