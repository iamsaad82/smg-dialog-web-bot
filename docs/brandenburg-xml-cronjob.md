# Brandenburg XML-Daten Cronjob

Diese Dokumentation beschreibt, wie der automatische Import der Brandenburg XML-Daten als Cronjob eingerichtet wird. Das ermöglicht die regelmäßige Aktualisierung der strukturierten Daten, ohne dass manuelle Eingriffe erforderlich sind.

## Funktionsweise des Import-Skripts

Das Skript `backend/scripts/brandenburg_xml_cron_import.py` führt folgende Schritte aus:

1. **Herunterladen der XML-Datei** mit angepasstem User-Agent (um 403-Fehler zu umgehen)
2. **Prüfen auf Änderungen** anhand der MD5-Prüfsumme
3. **Nur bei Änderungen**: Löschen aller existierenden strukturierten Daten für den Tenant und Import der neuen Daten

Dadurch wird verhindert, dass sich Duplikate ansammeln, und es werden nur dann Daten neu importiert, wenn die Quelldatei tatsächlich aktualisiert wurde.

## Voraussetzungen

- Laufender Docker-Container für den Backend-Dienst
- Berechtigungen zum Einrichten von Cronjobs auf dem Host-System
- Das Import-Skript `brandenburg_xml_cron_import.py` ist bereits im Repository vorhanden und ausführbar

## Einrichtung des Cronjobs

### 1. Manuelle Einrichtung auf dem Host-System

Um den Cronjob direkt auf dem Host-System einzurichten:

```bash
# Cronjob-Editor öffnen
crontab -e

# Folgende Zeile hinzufügen (Ausführung jeden Tag um 3:00 Uhr morgens)
0 3 * * * docker exec smg-dialog-web-bot-backend-1 python /app/scripts/brandenburg_xml_cron_import.py >> /var/log/brandenburg-import.log 2>&1
```

### 2. Einrichtung mit Docker-Compose

Alternativ kann der Cronjob als separater Dienst in der Docker-Compose-Konfiguration definiert werden:

1. Öffne die `docker-compose.yml`-Datei und füge folgenden Dienst hinzu:

```yaml
services:
  # Vorhandene Dienste...
  
  brandenburg-cron:
    image: alpine
    depends_on:
      - backend
    command: >
      /bin/sh -c "
        echo '0 3 * * * docker exec smg-dialog-web-bot-backend-1 python /app/scripts/brandenburg_xml_cron_import.py >> /proc/1/fd/1 2>&1' > /etc/crontabs/root &&
        crond -f -d 8
      "
    restart: unless-stopped
```

### 3. Einrichtung als systemd-Timer

Für eine robustere Lösung kann ein systemd-Timer verwendet werden:

1. Erstelle eine Service-Datei:

```bash
sudo nano /etc/systemd/system/brandenburg-import.service
```

Füge folgenden Inhalt ein:

```ini
[Unit]
Description=Brandenburg XML Import
After=docker.service

[Service]
Type=oneshot
ExecStart=/usr/bin/docker exec smg-dialog-web-bot-backend-1 python /app/scripts/brandenburg_xml_cron_import.py
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

2. Erstelle eine Timer-Datei:

```bash
sudo nano /etc/systemd/system/brandenburg-import.timer
```

Füge folgenden Inhalt ein:

```ini
[Unit]
Description=Täglich Brandenburg XML Import ausführen
Requires=brandenburg-import.service

[Timer]
Unit=brandenburg-import.service
OnCalendar=*-*-* 03:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

3. Aktiviere und starte den Timer:

```bash
sudo systemctl enable brandenburg-import.timer
sudo systemctl start brandenburg-import.timer
```

4. Überprüfe den Status des Timers:

```bash
sudo systemctl status brandenburg-import.timer
```

## Überwachung und Protokollierung

Das Import-Skript schreibt ausführliche Logs nach:

```
/app/logs/brandenburg_xml_import.log
```

Diese Logs enthalten Informationen über:
- Erfolgreiche Downloads der XML-Datei
- Festgestellte Änderungen (Prüfsumme)
- Anzahl der gelöschten und neu importierten Elemente
- Fehler und Warnungen

## Fehlerbehandlung

Wenn der Import fehlschlägt, enthält die Log-Datei detaillierte Fehlermeldungen. Häufige Ursachen für Fehler:

- XML-Datei konnte nicht heruntergeladen werden (Netzwerkprobleme, geänderte URL)
- Ungültige oder beschädigte XML-Datei
- Probleme mit Weaviate (Verbindungsprobleme, fehlende Berechtigungen)

### Manueller Test des Imports

Um den Import-Prozess manuell zu testen:

```bash
docker exec smg-dialog-web-bot-backend-1 python /app/scripts/brandenburg_xml_cron_import.py
```

## Strategien für den Produktionsbetrieb

- **Monitoring**: Überwachen Sie regelmäßig die Import-Logs auf Fehler
- **Benachrichtigungen**: Richten Sie E-Mail-Benachrichtigungen für fehlgeschlagene Imports ein
- **Regelmäßige Kontrolle**: Überprüfen Sie monatlich die aktuelle XML-Struktur, um sicherzustellen, dass der Parser noch korrekt funktioniert

## Anpassung des Import-Intervalls

Das Standard-Intervall ist täglich um 3:00 Uhr morgens. Um das Intervall anzupassen:

- **Cron**: Ändern Sie das Cron-Pattern (z.B. `0 */6 * * *` für alle 6 Stunden)
- **systemd-Timer**: Passen Sie den `OnCalendar`-Wert in der Timer-Datei an

## Sicherheitsvorkehrungen

- Das Skript arbeitet idempotent: Mehrfache Ausführung hat keine negativen Auswirkungen
- Es importiert nur neue Daten bei Änderungen der Quelldatei
- Alte Daten werden vollständig gelöscht, bevor neue importiert werden 