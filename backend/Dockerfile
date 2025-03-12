FROM python:3.10-slim

WORKDIR /app

# System-Abhängigkeiten installieren
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python-Abhängigkeiten installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Start-Script erstellen
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
# Warten auf PostgreSQL\n\
echo "Warte auf PostgreSQL..."\n\
while ! nc -z $POSTGRES_HOST 5432; do\n\
  sleep 1\n\
done\n\
echo "PostgreSQL ist bereit"\n\
\n\
# Warten auf Weaviate\n\
echo "Warte auf Weaviate..."\n\
while ! curl -s http://weaviate:8080/v1/.well-known/ready > /dev/null; do\n\
  sleep 1\n\
done\n\
echo "Weaviate ist bereit"\n\
\n\
# Migrationen ausführen\n\
echo "Führe Datenbank-Migrationen aus..."\n\
alembic upgrade head\n\
\n\
# FastAPI-Server starten\n\
echo "Starte FastAPI-Server..."\n\
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT' > /app/start.sh \
    && chmod +x /app/start.sh

# App-Code kopieren
COPY . .

# Port exponieren
EXPOSE 8000

# Umgebungsvariablen setzen
ENV PYTHONPATH=/app
ENV PORT=8000

# Starten mit unserem Script
CMD ["/app/start.sh"] 