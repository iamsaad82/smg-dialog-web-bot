# Brandenburg XML-Integration: Deployment auf Render

Diese Anleitung beschreibt, wie die Brandenburg XML-Integration auf Render deployt wird. Sie umfasst sowohl die Backend-Konfiguration als auch die Einrichtung des Cronjobs für den automatischen Import.

## Voraussetzungen

- Ein Render-Konto mit Zugriff auf die Render-Umgebung
- Die notwendigen Zugriffsrechte zur Konfiguration von Web Services und Cronjobs
- Ein Admin-Benutzer in der SMG-Dialog-Anwendung

## 1. Vorbereitung: Admin-Token generieren

Bevor Sie mit dem Deployment beginnen, müssen Sie ein langlebiges Admin-Token generieren, das für den Cronjob verwendet wird:

### Lokal:

```bash
# Wechseln Sie in das Backend-Verzeichnis
cd backend

# Setzen Sie die erforderlichen Umgebungsvariablen
export ADMIN_USERNAME=<admin_username>
export ADMIN_PASSWORD=<admin_password>
export TOKEN_EXPIRY_DAYS=365

# Führen Sie das Skript aus
python scripts/create_admin_token.py --output admin_token.txt

# Sichern Sie das generierte Token für die spätere Verwendung
cat admin_token.txt
```

### Alternativ auf dem Server:

```bash
# Verbinden Sie sich mit dem Server
ssh <user>@<server>

# Führen Sie das Skript im Backend-Container aus
docker exec -it smg-dialog-web-bot-backend-1 python /app/scripts/create_admin_token.py
```

Speichern Sie das generierte Token sicher ab. Es wird später für den Cronjob benötigt.

## 2. Backend-Konfiguration auf Render

### 2.1 Web Service aktualisieren

1. Melden Sie sich bei Render an und navigieren Sie zu Ihrem Dashboard
2. Wählen Sie den Web Service aus, der das Backend hostet
3. Stellen Sie sicher, dass die folgenden Umgebungsvariablen konfiguriert sind:

| Umgebungsvariable | Beschreibung |
|------------------|-------------|
| `WEAVIATE_URL` | URL des Weaviate-Dienstes |
| `POSTGRES_URL` | PostgreSQL-Verbindungsstring |
| `JWT_SECRET_KEY` | Secret Key für JWT-Token (muss mit dem beim Token-Generieren verwendeten übereinstimmen) |

4. Aktualisieren Sie den Code-Branch oder führen Sie ein manuelles Deployment durch

### 2.2 Weaviate-Schemas überprüfen

Stellen Sie sicher, dass die Weaviate-Schemas für die Brandenburg-Daten korrekt eingerichtet sind. Die Schemas werden beim ersten Import automatisch erstellt.

## 3. Cronjob für automatischen Import einrichten

Folgen Sie der Anleitung zur [Cronjob-Einrichtung auf Render](brandenburg-xml-cronjob.md) und achten Sie besonders auf die folgenden Punkte:

### 3.1 Umgebungsvariablen für den Cronjob

Stellen Sie sicher, dass Sie die folgenden Umgebungsvariablen für den Cronjob konfigurieren:

| Umgebungsvariable | Wert | Beschreibung |
|------------------|------|-------------|
| `ADMIN_API_KEY` | `<generiertes_token>` | Das zuvor generierte Admin-Token |
| `BRANDENBURG_XML_URL` | `https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml` | URL der XML-Datei |
| `LOG_LEVEL` | `INFO` | Loglevel für das Skript (CRITICAL, ERROR, WARNING, INFO, DEBUG) |
| `API_BASE_URL` | `https://api.example.com` | URL des Backend-API-Dienstes |

### 3.2 Zeitplan für den Cronjob

Empfohlener Zeitplan: `0 3 * * *` (täglich um 3:00 Uhr)

Passen Sie den Zeitplan je nach Aktualisierungshäufigkeit der XML-Datei und Ihren Anforderungen an:
- Täglich: `0 3 * * *`
- Zweimal täglich: `0 3,15 * * *`
- Wöchentlich (Sonntags): `0 3 * * 0`

## 4. Deployment testen

Nach dem Deployment sollten Sie einen Test durchführen, um sicherzustellen, dass alles korrekt konfiguriert ist:

```bash
# Führen Sie das Testskript im Backend-Container aus
curl -X POST "https://api.example.com/api/v1/admin/tests/brandenburg-import" \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json"
```

Oder manuell auf dem Server:

```bash
docker exec -it smg-dialog-web-bot-backend-1 python /app/scripts/test_brandenburg_import_deployment.py
```

## 5. Tenant-Konfiguration

Stellen Sie sicher, dass mindestens ein Tenant mit aktivierter Brandenburg-Integration existiert:

```sql
-- SQL-Befehl zum Aktivieren der Brandenburg-Integration für einen Tenant
UPDATE tenants SET is_brandenburg = true WHERE id = '<tenant_id>';
```

## 6. Überwachung und Wartung

### 6.1 Logs überprüfen

Überprüfen Sie regelmäßig die Logs des Cronjobs auf Render, um sicherzustellen, dass der Import erfolgreich durchgeführt wird:

1. Navigieren Sie zum Cronjob im Render-Dashboard
2. Klicken Sie auf "Logs"
3. Suchen Sie nach folgenden Einträgen:
   - "Brandenburg XML-Import gestartet"
   - "Brandenburg XML-Import erfolgreich abgeschlossen"

### 6.2 Datenqualität überprüfen

Führen Sie regelmäßig Stichproben durch, um die Qualität der importierten Daten zu überprüfen:

1. Senden Sie eine Testanfrage an den Chatbot
2. Überprüfen Sie, ob die Antworten die erwarteten Brandenburg-Daten enthalten
3. Überprüfen Sie die Anzahl der importierten Datensätze und vergleichen Sie sie mit früheren Importen

### 6.3 XML-Struktur-Änderungen

Wenn sich die Struktur der XML-Datei ändert, müssen Sie möglicherweise den Parser anpassen:

1. Überprüfen Sie die aktuelle XML-Struktur
2. Passen Sie die Klasse `BrandenburgXMLParser` in `app/services/xml_parser_service.py` an
3. Testen Sie die Änderungen lokal, bevor Sie sie deployen

## 7. Fehlerbehandlung

### 7.1 Häufige Fehler und Lösungen

| Fehler | Ursache | Lösung |
|--------|---------|--------|
| `403 Forbidden` | XML-URL ist nicht zugänglich | Überprüfen Sie den User-Agent oder kontaktieren Sie den XML-Provider |
| `Keine Tenants gefunden` | Keine Tenants mit `is_brandenburg = true` | Konfigurieren Sie mindestens einen Tenant mit aktivierter Brandenburg-Integration |
| `XML-Parsing-Fehler` | Änderung in der XML-Struktur | Passen Sie den XML-Parser an |
| `Weaviate-Verbindungsfehler` | Probleme mit der Weaviate-Verbindung | Überprüfen Sie die Weaviate-URL und Verbindungseinstellungen |
| `Ungültige Anmeldeinformationen` | Ungültiges Admin-Token | Generieren Sie ein neues Admin-Token und aktualisieren Sie die Cronjob-Konfiguration |

### 7.2 Support kontaktieren

Bei anhaltenden Problemen kontaktieren Sie:

- **E-Mail:** support@example.com
- **Issue-Tracker:** https://github.com/example/smg-dialog-web-bot/issues

## 8. Best Practices

- Generieren Sie das Admin-Token regelmäßig neu (empfohlen: alle 3-6 Monate)
- Führen Sie vor größeren Updates immer einen lokalen Test durch
- Dokumentieren Sie Änderungen an der XML-Struktur oder am Parser
- Stellen Sie sicher, dass Backups der importierten Daten vorhanden sind
- Überwachen Sie die Logs regelmäßig auf Fehler oder Warnungen 