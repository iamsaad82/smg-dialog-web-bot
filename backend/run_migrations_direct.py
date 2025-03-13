#!/usr/bin/env python
"""
Direktes Migrations-Skript für Render-Deployment.
Dieses Skript umgeht Alembic und erstellt die Tabellen direkt mit SQLAlchemy.

Verwendung:
    python run_migrations_direct.py
"""

import os
import sys
import time
import logging
import sqlalchemy
from sqlalchemy import create_engine, inspect, MetaData, Table, Column, String, Integer, Text, DateTime, Boolean, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import UUID
import uuid
import psycopg2

# Logging konfigurieren
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Datenbank-URL aus den Umgebungsvariablen erstellen
def get_database_url():
    # Umgebungsvariablen lesen
    DB_USER = os.environ.get("POSTGRES_USER", "postgres")
    DB_PASSWORD = os.environ.get("POSTGRES_PASSWORD", "postgres")
    DB_HOST = os.environ.get("POSTGRES_HOST", "localhost")
    DB_PORT = os.environ.get("POSTGRES_PORT", "5432")
    DB_NAME = os.environ.get("POSTGRES_DB", "dialog_ai")
    
    # Datenbankverbindungs-URL erstellen
    return f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def create_tables_directly():
    """Erstellt die Datenbanktabellen direkt mit SQLAlchemy, ohne Alembic."""
    logger.info("Erstelle Tabellen direkt mit SQLAlchemy...")
    
    # Datenbankverbindung herstellen
    engine = create_engine(get_database_url())
    metadata = MetaData()
    
    # Prüfen, ob die 'tenants'-Tabelle bereits existiert
    inspector = inspect(engine)
    if 'tenants' in inspector.get_table_names():
        logger.info("Tabelle 'tenants' existiert bereits.")
        return True
    
    # Tenant-Tabelle definieren
    tenants = Table(
        'tenants',
        metadata,
        Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column('name', String(255), nullable=False),
        Column('api_key', String(255), nullable=False, unique=True),
        Column('created_at', DateTime(timezone=True), server_default=func.now()),
        Column('updated_at', DateTime(timezone=True), onupdate=func.now()),
        Column('description', Text),
        Column('contact_email', String(255)),
        Column('bot_name', String(255)),
        Column('bot_welcome_message', Text),
        Column('primary_color', String(255)),
        Column('secondary_color', String(255)),
        Column('logo_url', String(255)),
        Column('custom_instructions', Text),
        Column('use_mistral', Boolean, default=False),
        Column('bot_message_bg_color', String(255)),
        Column('bot_message_text_color', String(255)),
        Column('user_message_bg_color', String(255)),
        Column('user_message_text_color', String(255)),
        Column('config', JSON)
    )
    
    # User-Tabelle definieren
    users = Table(
        'users',
        metadata,
        Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column('email', String(255), nullable=False, unique=True),
        Column('hashed_password', String(255), nullable=False),
        Column('full_name', String(255)),
        Column('is_active', Boolean, default=True),
        Column('is_superuser', Boolean, default=False),
        Column('role', String(50), nullable=False),  # Rolle: ADMIN, AGENCY_ADMIN, EDITOR, USER
        Column('created_at', DateTime(timezone=True), server_default=func.now()),
        Column('updated_at', DateTime(timezone=True), onupdate=func.now()),
        Column('agency_id', UUID(as_uuid=True), nullable=True)
    )
    
    # Document-Tabelle definieren
    documents = Table(
        'documents',
        metadata,
        Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column('tenant_id', UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        Column('title', String(255), nullable=False),
        Column('content', Text, nullable=False),
        Column('source', String(255)),
        Column('created_at', DateTime(timezone=True), server_default=func.now()),
        Column('updated_at', DateTime(timezone=True), onupdate=func.now()),
        Column('metadata', JSON)
    )
    
    # Token-Blacklist-Tabelle definieren
    token_blacklist = Table(
        'token_blacklist',
        metadata,
        Column('id', Integer, primary_key=True, autoincrement=True),
        Column('token', String(1000), nullable=False),
        Column('expires_at', DateTime(timezone=True), nullable=False),
        Column('created_at', DateTime(timezone=True), server_default=func.now())
    )
    
    # UI-Components-Tabelle definieren
    ui_components = Table(
        'ui_components',
        metadata,
        Column('id', UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
        Column('tenant_id', UUID(as_uuid=True), ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        Column('name', String(255), nullable=False),
        Column('component_type', String(50), nullable=False),  # z.B. BUTTON, TEXT, IMAGE
        Column('content', Text),
        Column('properties', JSON),
        Column('created_at', DateTime(timezone=True), server_default=func.now()),
        Column('updated_at', DateTime(timezone=True), onupdate=func.now())
    )
    
    # Tabellen erstellen
    try:
        metadata.create_all(engine)
        logger.info("Datenbanktabellen erfolgreich erstellt.")
        return True
    except Exception as e:
        logger.error(f"Fehler beim Erstellen der Tabellen: {e}")
        return False

def wait_for_db():
    """Wartet, bis die Datenbank erreichbar ist."""
    logger.info("Warte auf Datenbankverbindung...")
    
    max_retries = 30
    retry_interval = 2
    
    for i in range(max_retries):
        try:
            # Datenbankverbindung herstellen
            conn = psycopg2.connect(get_database_url())
            conn.close()
            logger.info("Datenbankverbindung hergestellt!")
            return True
        except Exception as e:
            logger.warning(f"Verbindung zur Datenbank fehlgeschlagen (Versuch {i+1}/{max_retries}): {e}")
            time.sleep(retry_interval)
    
    logger.error(f"Konnte keine Verbindung zur Datenbank herstellen nach {max_retries} Versuchen.")
    return False

if __name__ == "__main__":
    logger.info("Starte direktes Migrations-Skript...")
    
    # Auf Datenbank warten
    if not wait_for_db():
        logger.error("Abbruch: Datenbank nicht erreichbar.")
        sys.exit(1)
    
    # Tabellen erstellen
    if not create_tables_directly():
        logger.error("Abbruch: Fehler beim Erstellen der Tabellen.")
        sys.exit(1)
    
    logger.info("Migrations-Skript erfolgreich abgeschlossen.")
    sys.exit(0) 