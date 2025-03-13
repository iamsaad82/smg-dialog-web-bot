# Anleitung zur manuellen Tabellenerstellung in Render

Da die automatische Datenbankmigration bei Render-Bereitstellungen Probleme verursacht, ist eine manuelle Erstellung der Tabellen erforderlich. Diese Anleitung führt Sie durch den Prozess.

## Voraussetzungen

- Zugriff auf die Render-Benutzeroberfläche
- Das SQL-Skript `create_tables.sql` aus diesem Repository

## Schritte zur manuellen Datenbankerstellung

### 1. Datenbankverbindung in Render öffnen

1. Melden Sie sich bei [Render](https://dashboard.render.com/) an
2. Navigieren Sie zu Ihrem Datenbankdienst (`dialog-ai-db`)
3. Klicken Sie im Dashboard auf "Connect"

### 2. Direkte SQL-Ausführung über die Render-Konsole

1. Klicken Sie auf "Shell" oder "Console Access"
2. In der Konsole geben Sie den folgenden Befehl ein, um den PostgreSQL-Client zu starten:
   ```
   psql
   ```
3. Kopieren Sie den Inhalt des SQL-Skripts `create_tables.sql` und fügen Sie ihn in die psql-Konsole ein
4. Führen Sie die Befehle aus

### 3. Über ein externes Tool ausführen

Alternativ können Sie auch externe Tools wie pgAdmin oder DBeaver verwenden:

1. Kopieren Sie die Verbindungsdetails aus dem Render-Dashboard (Host, Datenbankname, Benutzer, Passwort)
2. Verbinden Sie sich mit Ihrem bevorzugten Datenbank-Client
3. Führen Sie das SQL-Skript über den Client aus

### 4. Über eine lokale Verbindung ausführen

Wenn Sie eine lokale Verbindung zur Render-Datenbank herstellen möchten:

1. Installieren Sie den PostgreSQL-Client auf Ihrem Computer
2. Kopieren Sie die Verbindungsdetails aus dem Render-Dashboard
3. Führen Sie den folgenden Befehl in Ihrem Terminal aus:
   ```
   psql "postgres://Benutzername:Passwort@Host:Port/Datenbankname" -f create_tables.sql
   ```

## Überprüfung

Nachdem Sie die Tabellen erstellt haben, überprüfen Sie, ob alles korrekt erstellt wurde:

```sql
\dt
```

Sie sollten die folgenden Tabellen sehen:
- tenants
- users
- documents
- token_blacklist
- ui_components
- alembic_version

## Fehlerbehebung

Falls Probleme auftreten:

1. Stellen Sie sicher, dass Sie über ausreichende Berechtigungen für die Datenbank verfügen
2. Überprüfen Sie die Verbindungsdetails
3. Prüfen Sie, ob die Datenbank bereits Tabellen enthält, die in Konflikt stehen könnten 