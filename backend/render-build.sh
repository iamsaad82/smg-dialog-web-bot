#!/bin/bash
# render-build.sh - Wird während des Render-Builds ausgeführt

set -e

echo "=== RENDER BUILD SCRIPT ==="
echo "Aktuelles Verzeichnis: $(pwd)"

# Abhängigkeiten installieren
echo "Installiere Python-Abhängigkeiten..."
pip install --upgrade pip
pip install -r requirements.txt
pip install alembic psycopg2-binary sqlalchemy

# Warten auf die Datenbank
echo "Warte auf Verbindung zur Datenbank..."
max_retries=10
count=0
while [ $count -lt $max_retries ]; do
  count=$((count + 1))
  
  # Versuchen, eine Verbindung zur Datenbank herzustellen
  if python -c "
import os
import psycopg2

# Umgebungsvariablen lesen
DB_USER = os.environ.get('POSTGRES_USER', 'postgres')
DB_PASSWORD = os.environ.get('POSTGRES_PASSWORD', 'postgres')
DB_HOST = os.environ.get('POSTGRES_HOST', 'localhost')
DB_PORT = os.environ.get('POSTGRES_PORT', '5432')
DB_NAME = os.environ.get('POSTGRES_DB', 'dialog_ai')

# Verbindungs-URL erstellen
db_url = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

# Verbindung testen
try:
    conn = psycopg2.connect(db_url)
    conn.close()
    print('Datenbankverbindung erfolgreich hergestellt!')
    exit(0)
except Exception as e:
    print(f'Fehler bei der Datenbankverbindung: {e}')
    exit(1)
"; then
    echo "Datenbankverbindung erfolgreich!"
    break
  else
    echo "Versuch $count/$max_retries: Datenbank noch nicht erreichbar. Warte 5 Sekunden..."
    sleep 5
  fi
  
  if [ $count -eq $max_retries ]; then
    echo "Konnte keine Verbindung zur Datenbank herstellen nach $max_retries Versuchen."
    echo "Fahre trotzdem fort..."
    break
  fi
done

# Direktes Erstellen der Datenbanktabellen
echo "Erstelle Datenbanktabellen direkt..."
python run_migrations_direct.py || echo "Direkte Migration fehlgeschlagen, versuche Alembic..."

# Alembic-Migrationen ausführen
echo "Führe Alembic-Migrationen aus..."
alembic upgrade head || echo "Alembic-Migrationen fehlgeschlagen. Die Anwendung muss die Tabellen beim Start erstellen."

echo "=== BUILD ABGESCHLOSSEN ===" 