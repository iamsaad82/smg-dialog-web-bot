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

# Migrationen ausführen
echo "Führe Datenbank-Migrationen aus..."
alembic upgrade heads

# FastAPI-Server starten
echo "Starte FastAPI-Server..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT 