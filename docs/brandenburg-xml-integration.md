# Brandenburg XML-Integration

Diese Dokumentation beschreibt die Integration der XML-Daten aus dem Chatbot der Stadt Brandenburg.

## Übersicht

Die Stadt Brandenburg stellt Daten für ihren Chatbot als XML-Datei zur Verfügung unter der URL:
```
https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml
```

Die XML-Datei enthält eine Sammlung von Nachrichten (`<nachricht>`) mit verschiedenen Informationen, die in strukturierte Daten für Schulen, Ämter und Veranstaltungen umgewandelt werden können.

## XML-Format

Das XML-Format der Stadt Brandenburg hat folgende Struktur:

```xml
<stadtportal>
<nachrichten>
    <nachricht>
        <n>Titel der Nachricht</n>
        <beschreibung>Kurze Beschreibung</beschreibung>
        <haupttext>Hauptinhalt der Nachricht mit Details</haupttext>
        <link>URL zur weiteren Information</link>
    </nachricht>
    <!-- ... weitere Nachrichten ... -->
</nachrichten>
</stadtportal>
```

## Implementierung

### 1. XML-Parser

Die Klasse `BrandenburgXMLParser` wurde mit Funktionen erweitert, um XML-Daten direkt von einer URL zu laden und zu verarbeiten:

- Die Methode `parse_file` prüft nun, ob es sich um eine URL handelt, und ruft in diesem Fall `_parse_from_url` auf.
- Die neue Methode `_parse_from_url` verwendet das `requests`-Paket, um die XML-Daten von der URL zu laden.
- Der Parser ist darauf optimiert, `<nachricht>`-Elemente zu erkennen und zu verarbeiten.

### 2. Kategorisierung

Nachrichten werden anhand ihres Inhalts in folgende Kategorien eingeteilt:
- **Schulen**: Informationen über Bildungseinrichtungen
- **Ämter**: Informationen über Behörden, Bürgerservices, Verwaltungseinrichtungen
- **Veranstaltungen**: Informationen über Events, Termine, kulturelle Angebote

Die Kategorisierung erfolgt durch eine Kombination aus:
- Schlüsselwort-Erkennung
- Muster-Erkennung für typische Inhalte (z.B. Öffnungszeiten, Daten, Adressen)
- Gewichtung von Vorkommen in Titel, Beschreibung und Haupttext

### 3. Datenextraktion

Aus den kategorisierten Nachrichten werden strukturierte Daten extrahiert:

- **Schulen**: Name, Typ, Adresse, Kontaktdaten
- **Ämter**: Name, Abteilung, Adresse, Öffnungszeiten, Services, Kontaktdaten
- **Veranstaltungen**: Titel, Datum, Zeit, Ort, Beschreibung, Veranstalter, Kontaktdaten

### 4. API-Endpunkte

Neue API-Endpunkte wurden hinzugefügt:

- `/api/v1/structured_data/import/brandenburg/url`: Importiert Daten direkt von der Brandenburg-XML-URL

## Nutzung

### Daten über URL importieren

Der Import kann mit folgendem Befehl über die API gestartet werden:

```bash
curl -X POST "http://localhost:8000/api/v1/structured_data/import/brandenburg/url" \
     -H "accept: application/json" \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer {API_TOKEN}" \
     -d '{"url": "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"}'
```

### Testskript

Für Testzwecke steht ein Skript zur Verfügung, das die XML-Daten von der URL lädt und analysiert:

```bash
cd /path/to/project
./backend/test_brandenburg_url_import.py
```

Optionen:
- `--url`: Alternative URL zur XML-Datei
- `--output`: Verzeichnis für die Ausgabedateien (Standard: "results")
- `--samples`: Anzahl der anzuzeigenden Beispiele pro Datentyp (Standard: 3)

## Wartung

- Der XML-Parser kann bei Änderungen des XML-Formats angepasst werden
- Die Kategorisierungsregeln können durch Hinzufügen weiterer Schlüsselwörter oder Muster verfeinert werden
- Die Extraktion kann um weitere Datenfelder erweitert werden

## Fehlerbehandlung

Der XML-Parser und der Datenimport enthalten umfangreiche Fehlerbehandlung:
- Prüfung der URL-Erreichbarkeit
- Validierung des XML-Formats
- Protokollierung von Fehlern
- Robuste Extraktion auch bei unvollständigen Daten 