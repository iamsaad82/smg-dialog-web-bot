FROM python:3.10-slim

WORKDIR /app

# System-Abhängigkeiten installieren
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Email-validator vor allen anderen Paketen installieren
RUN pip install email-validator

# Python-Abhängigkeiten installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Explizit email-validator und pydantic[email] mit '--no-deps' installieren, um zu vermeiden,
# dass andere Abhängigkeiten aktualisiert werden
RUN pip install --no-cache-dir --no-deps email-validator pydantic[email] && \
    pip install --no-cache-dir dnspython idna

# Überprüfen, ob das Package korrekt installiert wurde
RUN python -c "from pydantic import EmailStr; print('EmailStr erfolgreich importiert')"

# App-Code kopieren
COPY . .

# start.sh ausführbar machen
RUN chmod +x /app/start.sh

# Port exponieren
EXPOSE 8000

# Umgebungsvariablen setzen
ENV PYTHONPATH=/app
ENV PORT=8000

# Starten mit unserem Script
CMD ["/app/start.sh"] 