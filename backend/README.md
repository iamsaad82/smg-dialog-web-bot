# SMG Dialog Backend

Dies ist das Backend für die SMG Dialog Web Bot Plattform. Es basiert auf FastAPI und verwendet eine Postgres-Datenbank sowie Weaviate als Vektordatenbank.

## Einrichtung für Entwicklung

1. Python 3.10+ installieren
2. Virtual Environment erstellen und aktivieren
   ```bash
   python -m venv venv
   source venv/bin/activate  # Unter Windows: venv\Scripts\activate
   ```
3. Abhängigkeiten installieren
   ```bash
   pip install -r requirements.txt
   ```
4. Umgebungsvariablen konfigurieren
   ```bash
   cp .env.example .env
   # Editieren Sie die .env-Datei und fügen Sie Ihre Konfiguration hinzu
   ```
5. Datenbank-Migrationen ausführen
   ```bash
   alembic upgrade head
   ```
6. Server starten
   ```bash
   uvicorn app.main:app --reload
   ```

## Einrichtung für Produktiveinsatz

Für den Einsatz in einer Produktionsumgebung müssen folgende Schritte durchgeführt werden:

### 1. Umgebungsvariablen konfigurieren

Kopieren Sie die `.env.example` Datei und passen Sie die Werte entsprechend an:

```bash
cp .env.example .env
```

Wichtige Umgebungsvariablen:

- `DATABASE_URL`: URL zur Postgres-Datenbank
- `OPENAI_API_KEY`: API-Key für OpenAI
- `WEAVIATE_URL`: URL zur Weaviate-Instanz
- `SECRET_KEY`: Geheimer Schlüssel für JWT-Token (sollte ein langer, zufälliger String sein)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Gültigkeitsdauer der Access-Tokens in Minuten (Standard: 60)
- `AUTO_CREATE_SUPERUSER`: Auf `true` setzen, um automatisch einen Superuser beim ersten Start zu erstellen
- `FIRST_SUPERUSER_EMAIL`: E-Mail-Adresse für den Superuser
- `FIRST_SUPERUSER_USERNAME`: Benutzername für den Superuser
- `FIRST_SUPERUSER_PASSWORD`: Passwort für den Superuser (unbedingt ein sicheres Passwort setzen!)
- `FIRST_SUPERUSER_FIRSTNAME`: Vorname des Superusers (optional)
- `FIRST_SUPERUSER_LASTNAME`: Nachname des Superusers (optional)

### 2. Datenbank-Migrationen ausführen

```bash
alembic upgrade head
```

### 3. Super-Admin-Benutzer erstellen

Sie haben zwei Möglichkeiten, einen Super-Admin-Benutzer zu erstellen:

#### Option A: Automatische Erstellung beim ersten Start (empfohlen)

Setzen Sie folgende Umgebungsvariablen in der `.env`-Datei:

```
AUTO_CREATE_SUPERUSER=true
FIRST_SUPERUSER_USERNAME=admin
FIRST_SUPERUSER_EMAIL=admin@example.com
FIRST_SUPERUSER_PASSWORD=IhrSicheresPasswort
```

Bei dieser Methode wird automatisch ein Admin-Benutzer erstellt, wenn beim Start der Anwendung noch kein Administrator existiert.

#### Option B: Manuelle Erstellung

Alternativ können Sie den Admin-Benutzer manuell erstellen:

```bash
python -m app.scripts.create_admin_user --username admin --email admin@example.com --password IhrSicheresPasswort --first-name Admin --last-name User
```

Ersetzen Sie die Parameter durch Ihre gewünschten Werte:

- `--username`: Benutzername für den Admin (z.B. "admin")
- `--email`: E-Mail-Adresse des Admins (z.B. "admin@example.com")
- `--password`: Sicheres Passwort für den Admin
- `--first-name`: Vorname des Admins (optional, Standard ist der Benutzername)
- `--last-name`: Nachname des Admins (optional)

### 4. Server starten

Für Produktionsumgebungen empfehlen wir die Verwendung von Gunicorn:

```bash
gunicorn app.main:app -k uvicorn.workers.UvicornWorker -w 4 --bind 0.0.0.0:8000
```

Oder mit Docker:

```bash
docker-compose up -d
```

## API-Dokumentation

Nach dem Start des Servers ist die API-Dokumentation unter folgenden URLs verfügbar:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Sicherheitshinweise

- Ändern Sie regelmäßig das Passwort des Super-Admin-Benutzers
- Verwenden Sie sichere Passwörter mit mindestens 12 Zeichen, Groß- und Kleinbuchstaben, Zahlen und Sonderzeichen
- Schützen Sie die `.env`-Datei und den Zugriff auf die Datenbank
- Aktivieren Sie SSL/TLS für alle API-Endpunkte im Produktiveinsatz
- Beschränken Sie den Zugriff auf die API durch IP-Filtering oder VPN
- Überprüfen Sie regelmäßig die Logs auf verdächtige Aktivitäten

## Fehlerbehebung

### Problem: Kann mich nicht als Admin anmelden

Überprüfen Sie:
1. Ob der Admin-Benutzer korrekt erstellt wurde (überprüfen Sie die Ausgabe des Skripts)
2. Ob der Benutzername und das Passwort korrekt eingegeben wurden
3. Ob die Authentifizierung im Backend korrekt konfiguriert ist (SECRET_KEY)

Um einen neuen Admin-Benutzer zu erstellen, falls der alte nicht mehr zugänglich ist:

```bash
python -m app.scripts.create_admin_user --username new_admin --email new_admin@example.com --password NeuesPasswort
```

### Problem: Datenbank-Migrationen können nicht ausgeführt werden

Überprüfen Sie:
1. Ob die Datenbank erreichbar ist und die Zugangsdaten korrekt sind
2. Ob Sie die richtige Alembic-Version verwenden
3. Ob bereits Tabellen in der Datenbank existieren, die in Konflikt stehen könnten

Zur Not können Sie die Datenbank zurücksetzen und neu migrieren:

```bash
alembic downgrade base  # Zurücksetzen aller Migrationen
alembic upgrade head    # Neu ausführen aller Migrationen
``` 