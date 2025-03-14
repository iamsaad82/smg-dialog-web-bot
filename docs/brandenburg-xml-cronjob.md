# Brandenburg XML-Import auf Render

Diese Dokumentation beschreibt, wie der Brandenburg XML-Import als Cronjob in der Render-Umgebung eingerichtet wird.

## Übersicht

Die Stadt Brandenburg stellt regelmäßig aktualisierte Daten unter der URL `https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml` bereit. Um diese Daten automatisch zu importieren, wird ein Cronjob eingerichtet, der das Import-Skript regelmäßig ausführt.

## Voraussetzungen

- Ein Render-Konto mit entsprechenden Rechten
- Zugriff auf die Render-Umgebung, in der die Anwendung läuft
- Ein gültiger Admin-API-Key für die Anwendung

## Einrichtung des Cronjobs

1. Loggen Sie sich in Ihr Render-Konto ein
2. Navigieren Sie zum Dashboard und wählen Sie "New +" und dann "Cron Job"
3. Geben Sie folgende Informationen ein:
   - Name: `brandenburg-xml-import`
   - Description: `Importiert regelmäßig XML-Daten von der Stadt Brandenburg`
   - Schedule: `0 3 * * *` (Täglich um 3:00 Uhr morgens)
   - Command: `cd /app && python -m backend.scripts.brandenburg_xml_import`
   - Destination Region: (Wählen Sie die Region, die am nächsten an Ihrem Hauptserver liegt)

4. Unter "Environment Variables" fügen Sie folgende Variablen hinzu:
   - `ADMIN_API_KEY`: Ihr Admin-API-Key (als "Secret" markieren)
   - `BRANDENBURG_XML_URL`: `https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml`
   - `LOG_LEVEL`: `INFO`
   - `API_BASE_URL`: URL Ihres Backend-Services (z.B. `https://ihr-service.onrender.com`)

5. Klicken Sie auf "Create Cron Job"

## Überwachung und Wartung

### Logs überprüfen

Um zu überprüfen, ob der Cronjob ordnungsgemäß funktioniert:

1. Navigieren Sie zu Ihrem Cronjob in der Render-Konsole
2. Klicken Sie auf "Logs"
3. Überprüfen Sie die Ausgabe nach dem letzten Lauf

Eine erfolgreiche Ausführung sollte Meldungen wie `Import erfolgreich` und `Brandenburg XML-Import erfolgreich abgeschlossen` enthalten.

### Manuelle Ausführung

Für Testzwecke oder bei Bedarf können Sie den Cronjob manuell ausführen:

1. Navigieren Sie zu Ihrem Cronjob in der Render-Konsole
2. Klicken Sie auf "Manual Run"

### Fehlerbehandlung

Typische Fehler und Lösungen:

- **API-Key-Probleme**: Überprüfen Sie, ob der ADMIN_API_KEY korrekt ist und noch gültig
- **Verbindungsprobleme**: Stellen Sie sicher, dass die XML-URL erreichbar ist und die API-Basis-URL korrekt ist
- **Timeout-Probleme**: Erhöhen Sie den Timeout-Wert in den Umgebungsvariablen, falls die XML-Datei sehr groß ist

## Anpassung der Import-Häufigkeit

Je nach Aktualisierungshäufigkeit der XML-Datei können Sie den Zeitplan des Cronjobs anpassen:

- **Täglich**: `0 3 * * *` (3:00 Uhr morgens)
- **Zweimal täglich**: `0 3,15 * * *` (3:00 und 15:00 Uhr)
- **Wöchentlich**: `0 3 * * 1` (Montags um 3:00 Uhr)

## Deaktivierung

Falls Sie den automatischen Import vorübergehend deaktivieren möchten:

1. Navigieren Sie zu Ihrem Cronjob in der Render-Konsole
2. Klicken Sie auf "Settings"
3. Unter "Schedule" ändern Sie den Wert auf `0 0 31 2 *` (niemals ausführen)
4. Klicken Sie auf "Save Changes" 