# Brandenburg-Integration im Admin-Bereich

Diese Dokumentation beschreibt, wie die Brandenburg-Integration im Admin-Bereich eingerichtet wird.

## Übersicht

Um die Integration von strukturierten Daten aus Brandenburg zu aktivieren, muss für einen Tenant die Option "Brandenburg-Integration" aktiviert werden. Diese Einstellung ist sowohl bei der Erstellung als auch bei der Bearbeitung eines Tenants verfügbar.

## Datenbankänderungen

Die Integration fügt folgende Änderungen an der Datenbank hinzu:

1. Eine neue Spalte `is_brandenburg` vom Typ `Boolean` in der Tabelle `tenants`
2. Standardmäßig ist dieser Wert auf `false` gesetzt

Um diese Änderungen zu aktivieren, muss die Alembic-Migration ausgeführt werden:

```bash
cd backend
alembic upgrade head
```

## Benutzeroberfläche

### Neuen Tenant mit Brandenburg-Integration erstellen

1. Navigieren Sie im Admin-Bereich zu "Tenants" und klicken Sie auf "Neuen Tenant erstellen"
2. Füllen Sie die allgemeinen Informationen aus
3. Im Abschnitt "Bot-Konfiguration" finden Sie die Option "Brandenburg-Integration aktivieren"
4. Aktivieren Sie diese Option, wenn der Tenant Zugriff auf strukturierte Daten aus Brandenburg haben soll
5. Speichern Sie den Tenant

### Bestehenden Tenant bearbeiten

1. Navigieren Sie im Admin-Bereich zum gewünschten Tenant und klicken Sie auf "Einstellungen"
2. Im Bereich "KI-Modell & Integrationen" finden Sie die Option "Brandenburg-Integration aktivieren"
3. Aktivieren oder deaktivieren Sie diese Option nach Bedarf
4. Speichern Sie die Änderungen

## Technische Details

Wenn die Brandenburg-Integration aktiviert ist, wird:

1. Der Tenant bei der API für strukturierte Daten als `is_brandenburg=true` markiert
2. Der XML-Import-Endpunkt automatisch konfiguriert, um Daten von der Brandenburg-XML-URL zu importieren
3. Die entsprechenden Renderer im Frontend aktiviert, um die strukturierten Daten anzuzeigen

## Import der Daten

Nach der Aktivierung der Brandenburg-Integration können Sie Daten importieren:

1. Navigieren Sie im Admin-Bereich zu "Strukturierte Daten" → "Brandenburg-Import"
2. Klicken Sie auf "Daten importieren", um Daten von der offiziellen Brandenburg-URL zu importieren:
   ```
   https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml
   ```
3. Nach erfolgreichem Import werden die Daten in Weaviate gespeichert und sind für den Chatbot verfügbar

## Wartung und Aktualisierung

Die XML-Daten aus Brandenburg sollten regelmäßig aktualisiert werden. Es wird empfohlen, einen täglichen Import zu planen, um sicherzustellen, dass die Daten aktuell bleiben. Dies kann über die Admin-Oberfläche oder über einen automatisierten Cronjob erfolgen. 