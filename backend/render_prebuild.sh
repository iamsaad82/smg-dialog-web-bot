#!/bin/bash
# render_prebuild.sh - Wird von Render vor dem Hauptbuild ausgeführt

echo "=== RENDER PREBUILD SCRIPT ==="
echo "Installiere Abhängigkeiten..."

# Sicherstellen, dass psycopg2 korrekt installiert ist 
pip install --upgrade pip
pip install psycopg2-binary

# Migrationsabhängigkeiten installieren
pip install alembic psycopg2-binary

echo "Abhängigkeiten erfolgreich installiert."
echo "=== PREBUILD ABGESCHLOSSEN ===" 