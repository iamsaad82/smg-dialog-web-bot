#!/usr/bin/env python
"""
Dieses Skript führt die Alembic-Migrationen aus, um die Datenbanktabellen zu erstellen.
Kann separat von der Hauptanwendung ausgeführt werden, z.B. in einer Render-Bereitstellung.

Verwendung:
    python run_migrations.py
"""

import os
import sys
import logging
import alembic.config
import time
import psycopg2
from app.core.config import settings

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def wait_for_db():
    """Wartet, bis die Datenbank erreichbar ist."""
    logger.info("Warte auf Datenbankverbindung...")
    
    max_retries = 30
    retry_interval = 2
    
    for i in range(max_retries):
        try:
            # Verbindungsstring aus den Umgebungsvariablen erstellen
            conn_string = f"postgresql://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
            
            # Versuchen, eine Verbindung herzustellen
            conn = psycopg2.connect(conn_string)
            conn.close()
            logger.info("Datenbankverbindung hergestellt!")
            return True
        except Exception as e:
            logger.warning(f"Verbindung zur Datenbank fehlgeschlagen (Versuch {i+1}/{max_retries}): {e}")
            time.sleep(retry_interval)
    
    logger.error(f"Konnte keine Verbindung zur Datenbank herstellen nach {max_retries} Versuchen.")
    return False

def run_migrations():
    """Führt die Alembic-Migrationen aus."""
    logger.info("Führe Datenbank-Migrationen aus...")
    
    try:
        # Alembic-Konfiguration laden
        alembic_args = [
            '--raiseerr',
            'upgrade', 'head',
        ]
        
        # Aktuelles Verzeichnis auf das Backend-Verzeichnis setzen
        current_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(current_dir)
        
        # Migrationen ausführen
        alembic.config.main(argv=alembic_args)
        
        logger.info("Migrationen erfolgreich ausgeführt!")
        return True
    except Exception as e:
        logger.error(f"Fehler beim Ausführen der Migrationen: {e}")
        return False

if __name__ == "__main__":
    logger.info("Starte Migrations-Skript...")
    
    # Auf Datenbank warten
    if not wait_for_db():
        logger.error("Abbruch: Datenbank nicht erreichbar.")
        sys.exit(1)
    
    # Migrationen ausführen
    if not run_migrations():
        logger.error("Abbruch: Fehler bei den Migrationen.")
        sys.exit(1)
    
    logger.info("Migrations-Skript erfolgreich abgeschlossen.")
    sys.exit(0) 