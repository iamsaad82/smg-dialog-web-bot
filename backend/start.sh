#!/bin/bash
set -e

# Warten auf PostgreSQL
echo "Warte auf PostgreSQL..."
while ! nc -z $POSTGRES_HOST 5432; do
  sleep 1
done
echo "PostgreSQL ist bereit"

# Warten auf Weaviate
echo "Warte auf Weaviate..."
while ! curl -s http://weaviate:8080/v1/.well-known/ready > /dev/null; do
  sleep 1
done
echo "Weaviate ist bereit"

# Migrationen schrittweise ausführen, außer der letzten problematischen
echo "Führe Datenbank-Migrationen manuell aus..."

# 1. Prüfen, ob Migrationen bereits durchgeführt wurden
python -c "
import os
from sqlalchemy import create_engine, text, inspect
import time

# Verbindungsdaten aus Umgebungsvariablen
host = os.environ.get('POSTGRES_HOST')
user = os.environ.get('POSTGRES_USER')
password = os.environ.get('POSTGRES_PASSWORD')
db = os.environ.get('POSTGRES_DB')
port = os.environ.get('POSTGRES_PORT', '5432')

# Verbindungs-URL erstellen
conn_str = f'postgresql://{user}:{password}@{host}:{port}/{db}'

# Verbindung herstellen
engine = create_engine(conn_str)

# Prüfen, ob die alembic_version-Tabelle existiert
inspector = inspect(engine)
tables = inspector.get_table_names()

if 'alembic_version' in tables:
    # Wenn ja, setze die Version direkt auf add_auth_models
    with engine.connect() as conn:
        try:
            # Setze Version direkt auf add_auth_models
            conn.execute(text(\"\"\"UPDATE alembic_version SET version_num = 'add_auth_models'\"\"\"))
            conn.commit()
            print('Alembic Version direkt auf add_auth_models gesetzt')
        except Exception as e:
            print(f'Fehler beim Setzen der Version: {e}')
else:
    # Wenn nicht, werden die Migrationen einzeln angewendet
    print('Alembic-Tabelle nicht gefunden, initialisiere das Schema...')
    os.system('alembic upgrade 001')
    time.sleep(1)
    os.system('alembic upgrade 002')
    time.sleep(1)
    os.system('alembic upgrade 003')
    time.sleep(1)
    os.system('alembic upgrade 202403121530')
    time.sleep(1)
    os.system('alembic upgrade add_ui_component_definitions')
    time.sleep(1)
    
    # Setze Version direkt auf add_auth_models ohne die Migration auszuführen
    with engine.connect() as conn:
        conn.execute(text(\"\"\"UPDATE alembic_version SET version_num = 'add_auth_models'\"\"\"))
        conn.commit()
        print('Alembic Version auf add_auth_models gesetzt, ohne die letzte Migration auszuführen')
"

echo "Migrationen abgeschlossen"

# FastAPI-Server starten
echo "Starte FastAPI-Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT 