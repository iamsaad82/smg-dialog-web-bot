# UI-Komponenten-System für SMG-Dialog-Web-Bot

## Übersicht

Dieses Dokument beschreibt das implementierte UI-Komponenten-System für den SMG-Dialog-Web-Bot. Ziel ist es, branchenspezifische interaktive Layouts und Antwortformate zu ermöglichen, die von Redakteuren ohne Programmierkenntnisse konfiguriert werden können.

## Ausgangssituation

Der Bot ist in der Lage, textbasierte Antworten zu generieren und diese mit interaktiven UI-Elementen anzureichern. Dies ist insbesondere für branchenspezifische Anforderungen wichtig, wie z.B.:

- **Shopping Center**: Öffnungszeiten, Ladenlokale, Angebote
- **Stadtverwaltung**: Behördeninformationen, Formulare, Terminbuchungen
- **Krankenkassen**: Leistungsübersicht, Arztsuche, Gesundheitstipps

## Aktueller Implementierungsstand

Das UI-Komponenten-System ist vollständig implementiert und einsatzbereit. Es unterstützt die regelbasierte Integration von interaktiven Elementen in die Bot-Antworten und bietet eine intuitive Konfigurationsoberfläche für Redakteure.

### Implementierte Komponenten

Folgende UI-Komponenten sind derzeit implementiert:

1. **OpeningHoursTable** - Strukturierte Anzeige von Öffnungszeiten
2. **ContactCard** - Darstellung von Kontaktinformationen 
3. **StoreMap** - Karte mit Standortmarkierungen
4. **ProductShowcase** - Darstellung von Produkten mit Bildern und Details

### Funktionsweise

Das System arbeitet auf zwei Arten:

1. **Regelbasierte Erkennung**:
   - Administratoren definieren Regeln, wann welche Komponente angezeigt werden soll
   - Diese Regeln basieren auf Schlüsselwörtern oder Intentionen in der Nutzeranfrage
   - Die Konfiguration erfolgt über ein benutzerfreundliches Interface im Admin-Bereich

2. **Intelligente Extraktion**:
   - Für Kontaktinformationen (`ContactCard`) gibt es einen speziellen Extraktor, der relevante Daten aus gefundenen Dokumenten extrahiert
   - Ein Intent-Detector erkennt, ob eine Anfrage nach Kontaktinformationen fragt

### Konzept: Custom Prompt zur UI-Steuerung

Das System basiert auf der Idee, dem Bot über den Custom Prompt in den Tenant-Einstellungen mitzuteilen, welche UI-Komponenten er für bestimmte Antworttypen verwenden soll. Der Bot fügt dann in seine Antworten Metadaten ein, die vom Frontend interpretiert werden, um passende UI-Komponenten zu rendern.

### Beispiel für einen UI-Komponenten-Prompt

```
Du bist ein Assistent für ein Shopping Center. 
Bei Fragen zu Öffnungszeiten verwende die "OpeningHoursTable"-Komponente.
Bei Fragen zu Standorten verwende die "StoreMap"-Komponente.
Bei Produktanfragen verwende die "ProductShowcase"-Komponente.

Formatiere deine Antwort IMMER so:
{
  "text": "Deine Textantwort",
  "component": "KomponentenName",
  "data": { ... komponentenspezifische Daten ... }
}
```

### Antwortformat

Der Bot liefert strukturierte Antworten im JSON-Format:

```json
{
  "text": "Hier sind die Öffnungszeiten unseres Shopping Centers.",
  "component": "OpeningHoursTable",
  "data": {
    "Montag": {"open": "10:00", "close": "20:00"},
    "Dienstag": {"open": "10:00", "close": "20:00"},
    // weitere Tage...
  }
}
```

## Implementierungsplan

Die Entwicklung wurde in vier Phasen durchgeführt:

### Phase 1: Proof of Concept ✅ (Abgeschlossen)

- [x] Konzeptionierung und Planung
- [x] Entwicklung von 4 grundlegenden UI-Komponenten
- [x] Anpassung des Bot-Prompts für Komponenten-Unterstützung
- [x] Implementierung eines Frontend-Parsers
- [x] Entwicklung eines Komponenten-Renderers
- [x] Testumgebung für verschiedene Szenarien

### Phase 2: Redakteurs-Werkzeuge ✅ (Abgeschlossen)

- [x] Entwicklung eines Prompt-Editors für Redakteure
- [x] Erstellung einer Komponenten-Dokumentation
- [x] Implementierung einer Test-Umgebung für Redakteure
- [x] Speichern und Verwalten von benutzerdefinierten Prompts

### Phase 3: Streaming-Unterstützung ✅ (Abgeschlossen)

- [x] Entwicklung eines Streaming-Parsers für Bot-Antworten
- [x] Anpassung des Frontend-Renderers für gestreamte Inhalte
- [x] Optimierung der Benutzererfahrung bei gestreamten Antworten

### Phase 4: Branchenspezifische Erweiterungen ✅ (Abgeschlossen)

- [x] Entwicklung branchenspezifischer Komponenten
- [x] Erstellung von Prompt-Vorlagen für verschiedene Branchen
- [x] Erweiterung der Komponenten-Bibliothek
- [x] Optimierung basierend auf Nutzerfeedback

## Technische Architektur

```
┌─ Admin-Bereich ────────────────┐    ┌─ Bot-Backend ────────────────┐
│                                │    │                              │
│ ┌─ Komponenten-Verwaltung ───┐ │    │ ┌─ Prompt Management ─────┐ │
│ │ - Komponenten hinzufügen   │ │    │ │ - Tenant-spezifische    │ │
│ │ - Parameter konfigurieren  │ │    │ │   Prompts               │ │
│ └──────────────────────────┬─┘ │    │ │ - Komponenten-Register  │ │
│                            │    │    │ └───────────────────────┬─┘ │
│ ┌─ Prompt-Editor ─────────┐│    │    │                         │   │
│ │ - Visueller Editor      ├┘    │    │ ┌─ LLM-Integration ────┐│   │
│ │ - Vorlagen              │     │◄───┼─┤ - Antwort-Streaming  ├┘   │
│ │ - Testumgebung          │     │    │ │ - Komponenten-Parser │    │
│ └────────────────────────┬┘     │    │ └──────────────────────┘    │
│                          │      │    │                              │
└──────────────────────────┼──────┘    └──────────────────────────────┘
                           │                         ▲
                           │                         │
                           ▼                         │
┌─ Frontend ──────────────────────────────────────────┐
│                                                     │
│ ┌─ Chat-Interface ───────────────────────────────┐ │
│ │                                                │ │
│ │ ┌─ Message-Renderer ─────────────────────────┐ │ │
│ │ │ - Text-Renderer                            │ │ │
│ │ │ - Komponenten-Renderer                     │ │ │
│ │ │ - Streaming-Handler                        │ │ │
│ │ └────────────────────────────────────────────┘ │ │
│ │                                                │ │
│ └────────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Implementierte Schlüsselkomponenten

### 1. UI-Komponenten-Bibliothek

Eine Sammlung von React-Komponenten, die für verschiedene Antworttypen optimiert sind:

- **OpeningHoursTable**: Strukturierte Anzeige von Öffnungszeiten
- **StoreMap**: Karte mit Standortmarkierungen
- **ProductShowcase**: Darstellung von Produkten mit Bildern und Details
- **ContactCard**: Anzeige von Kontaktinformationen mit Aktionen (Anrufen, E-Mail, Website)

### 2. Frontend-Parser

Der Parser interpretiert die vom Bot gelieferten strukturierten Antworten und extrahiert Komponenten-Informationen:

```javascript
// Implementiert in frontend/src/api/chat.ts
if (content.includes('interactive_elements')) {
  const parsedData = JSON.parse(content);
  
  // Interaktive Elemente übergeben, wenn vorhanden
  if (parsedData.interactive_elements && onInteractiveElements) {
    console.log("Interaktive Elemente gefunden:", parsedData.interactive_elements);
    onInteractiveElements(parsedData.interactive_elements);
  }
  
  // Eventuellen Text trotzdem verarbeiten
  if (parsedData.text !== undefined) {
    onChunk(parsedData.text);
  }
}
```

### 3. Komponenten-Renderer

Der Renderer wählt basierend auf den Metadaten die passende UI-Komponente aus und rendert sie. Dies ist im `InteractiveElementRenderer` implementiert:

```jsx
// Implementiert in frontend/src/components/interactive/InteractiveElementRenderer.tsx
function InteractiveElementRenderer({ elements }) {
  return (
    <SimpleGrid columns={{ base: 1, sm: Math.min(elements.length, 3) }} spacing={2}>
      {elements.map((element, index) => {
        switch (element.type) {
          case 'opening_hours_table':
            return (
              <OpeningHoursTable
                key={index}
                data={element.data}
                title={element.title}
                description={element.label}
              />
            );
          case 'contact_card':
            return (
              <ContactCard
                key={index}
                contacts={element.contacts}
                title={element.title}
                description={element.label}
                layout={element.layout}
                showActions={element.showActions}
              />
            );
          // weitere Komponenten...
        }
      })}
    </SimpleGrid>
  );
}
```

### 4. Prompt-Editor für Redakteure

Der `UIComponentsManager` bietet ein visuelles Interface, mit dem Redakteure ohne Programmierkenntnisse Komponenten-Regeln definieren können:

```jsx
// Implementiert in frontend/src/components/ui-components-editor/UIComponentsManager.tsx
function UIComponentsManager({
  tenantId,
  tenantName,
  initialPrompt,
  initialRules,
  onSave
}) {
  // Zustandsverwaltung
  const [activeTab, setActiveTab] = useState("rules");
  const [currentConfig, setCurrentConfig] = useState({
    prompt: initialPrompt,
    rules: initialRules
  });
  
  // Speichern der Konfiguration
  const handleSaveConfig = async (newConfig) => {
    const success = await onSave(newConfig);
    if (success) {
      setCurrentConfig(newConfig);
    }
    return success;
  };
  
  // Tabs für Konfiguration, Live-Vorschau und Komponenten-Definitionen
  return (
    <Tabs>
      <TabsList>
        <TabsTrigger value="config">Konfiguration</TabsTrigger>
        <TabsTrigger value="preview">Live-Vorschau</TabsTrigger>
        <TabsTrigger value="definitions">Komponenten-Definitionen</TabsTrigger>
      </TabsList>
      
      <TabsContent>
        {/* Editor-Komponenten */}
      </TabsContent>
    </Tabs>
  );
}
```

### 5. Backend-Integration

Das Backend unterstützt die Extraktion von interaktiven Elementen basierend auf dem Kontext der Anfrage und der gefundenen Dokumente:

```python
# Implementiert in backend/app/services/rag_service.py
# Interaktive Elemente extrahieren und zurückgeben
doc_texts = [doc.get("content", "") for doc in retrieved_docs]
interactive_elements = interactive_factory.extract_interactive_elements(
    tenant_id=tenant_id,
    query=query,
    doc_texts=doc_texts
)

if interactive_elements:
    # Interaktive Elemente als JSON-String codieren
    elements_json = [element.to_json() for element in interactive_elements]
    yield f"\n\n<!-- INTERACTIVE_ELEMENTS: {json.dumps(elements_json)} -->"
```

## Datenbankmodellierung

```python
# Implementiert in backend/app/db/models.py
class UIComponentDefinition(Base):
    __tablename__ = "ui_component_definitions"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)  # z.B. "OpeningHoursTable"
    description = Column(Text, nullable=True)  # Beschreibung für Redakteure
    example_format = Column(Text, nullable=False)  # JSON-Beispielformat
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## Limitationen und Verbesserungspotenzial

1. **Fehlende Extraktoren**: Während es für Kontakte einen speziellen Extraktor gibt, fehlen solche für andere Komponententypen wie Öffnungszeiten. Es wäre sinnvoll, spezifische Extraktoren für alle Komponententypen zu implementieren.

2. **Datenextraktion**: Die Datenextraktion aus Dokumenten für spezifische Komponenten ist nicht vollständig implementiert, was dazu führen kann, dass zwar die richtige Komponente angezeigt wird, aber mit generischen Daten.

3. **Intent-Erkennung**: Die Intent-Erkennung könnte verbessert werden, um präziser zu verstehen, wann welche Komponente angezeigt werden sollte.

## Best Practices für UI-Komponenten-Prompts

1. **Klare Anweisungen geben**:
   ```
   Bei Fragen zu Öffnungszeiten MUSST du die OpeningHoursTable-Komponente verwenden.
   ```

2. **Spezifische Trigger definieren**:
   ```
   Wenn der Nutzer nach "Öffnungszeiten", "Wann geöffnet", oder "Wann hat ... auf" fragt,
   verwende die OpeningHoursTable-Komponente.
   ```

3. **Formatierung betonen**:
   ```
   Formatiere deine Antwort IMMER als JSON mit den Feldern "text", "component" und "data".
   ```

4. **Beispiele einbauen**:
   ```
   Beispiel: Für die Frage "Wann habt ihr geöffnet?" sollte deine Antwort so aussehen:
   {"text": "Hier sind unsere Öffnungszeiten", "component": "OpeningHoursTable", "data": {...}}
   ```

## Zukünftige Erweiterungen

1. **Erweiterte Datenextraktion**: Implementierung spezifischer Extraktoren für alle Komponententypen, ähnlich dem `ContactExtractor`.

2. **Weitere Komponenten**: Entwicklung zusätzlicher branchenspezifischer Komponenten (z.B. AppointmentScheduler, FormDownload).

3. **Verbesserter Intent-Detector**: Optimierung der Intent-Erkennung für präzisere Komponentenauswahl.

4. **Analytics**: Integration von Nutzungsstatistiken für UI-Komponenten, um deren Effektivität zu messen.

---

*Letzte Aktualisierung: September 2023* 