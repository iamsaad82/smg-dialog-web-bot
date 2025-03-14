# Tenant-spezifische Rendering-Lösung

## Übersicht

Dieses Dokument beschreibt die Implementierung einer flexiblen, tenant-spezifischen Rendering-Lösung für strukturierte Daten in der Chat-Anwendung. Die Lösung ermöglicht es, verschiedene Datenquellen und Formate je nach Tenant unterschiedlich zu verarbeiten und darzustellen.

## Problemstellung

Wir haben verschiedene Tenants mit unterschiedlichen Datenquellen:
- **Stadt Brandenburg an der Havel**: Daten kommen aus einer XML-Quelle
- **Tenant 2**: Daten werden per Web-Crawling gesammelt und als Markdown gespeichert

Jeder Tenant benötigt eine spezialisierte Darstellung seiner strukturierten Daten, wobei die Formate zwischen den Tenants stark variieren können.

## Architektur

Die Lösung basiert auf einem modularen, erweiterbaren Ansatz:

1. **Tenant-spezifische Renderer**: Jeder Tenant hat eigene Renderer für seine Datentypen
2. **Registry-Mechanismus**: Zentrale Verwaltung aller verfügbaren Renderer
3. **Konfigurationsmanagement**: Pro Tenant konfigurierbare Rendering-Optionen
4. **Admin-Integration**: Einstellmöglichkeiten im Admin-Bereich

### Datenfluss

```
XML/MD → Parser → Weaviate → Chatbot → Antwort mit strukturierten Daten → Tenant-Renderer → UI
```

## Projektstruktur

```
frontend/
  ├── src/
      ├── components/
      │   ├── bot-demo/
      │   │   ├── chat/
      │   │   │   ├── tenant-renderers/  # Neue Ordnerstruktur für Tenant-Rendering
      │   │   │   │   ├── index.ts       # Zentraler Export für alle Renderer
      │   │   │   │   ├── types.ts       # Gemeinsame Typdefinitionen
      │   │   │   │   ├── config.ts      # Tenant-Konfiguration
      │   │   │   │   ├── GenericRenderer.tsx  # Fallback-Renderer
      │   │   │   │   ├── brandenburg/   # Tenant-spezifischer Ordner
      │   │   │   │   │   ├── index.ts   # Hauptexport
      │   │   │   │   │   ├── types.ts   # Brandenburg-spezifische Typen
      │   │   │   │   │   ├── renderers/ # Spezialisierte Renderer
      │   │   │   │   │   │   ├── SchoolRenderer.tsx
      │   │   │   │   │   │   ├── OfficeRenderer.tsx
      │   │   │   │   │   │   ├── EventRenderer.tsx
      │   │   │   │   ├── tenant-2/      # Weiterer Tenant-Ordner
      │   │   │   ├── MessageItem.tsx    # Integration der Tenant-Renderer
      ├── admin/                          # Admin-Komponenten
      │   ├── tenant-config/              # Tenant-Konfiguration im Admin
      │       ├── TenantRendererConfig.tsx
```

## Kernkomponenten

### 1. Gemeinsame Typdefinitionen (`types.ts`)

Definiert die grundlegenden Interfaces und Typen, die von allen Tenant-Renderern verwendet werden:
- `TenantRendererConfig`: Konfiguration für jeden Tenant-Renderer
- `StructuredData`: Format für strukturierte Daten aus dem Backend
- `TenantRendererProps`: Props für Renderer-Komponenten
- `RenderersRegistry`: Registry für alle verfügbaren Renderer

### 2. Tenant-Konfiguration (`config.ts`)

Verwaltet die verfügbaren Tenant-Konfigurationen und bietet Funktionen zum Abrufen der Konfiguration basierend auf der Tenant-ID.

### 3. Hauptexport (`index.ts`)

Bietet:
- `useTenantId()`: Hook zum Abrufen der aktuellen Tenant-ID
- `getRendererForTenant()`: Funktion zum Abrufen des passenden Renderers
- `TenantAwareRenderer`: Wrapper-Komponente, die automatisch den richtigen Renderer auswählt

### 4. Tenant-spezifische Implementierungen

Jeder Tenant hat seine eigenen:
- Typdefinitionen für seine Datenstrukturen
- Spezialisierte Renderer für verschiedene Inhaltstypen
- Konfigurationsoptionen

### 5. Integration in `MessageItem.tsx`

Nutzt die `TenantAwareRenderer`-Komponente, um strukturierte Daten basierend auf dem aktuellen Tenant zu rendern.

## Implementierungsschritte

### 1. Grundlegende Struktur schaffen
- Ordnerstruktur erstellen
- Gemeinsame Typdefinitionen implementieren
- Konfigurationsmanagement aufsetzen

### 2. Brandenburg-Implementierung
- Typdefinitionen für Brandenburg-Daten erstellen
- Renderer für Schulen, Ämter und Veranstaltungen implementieren
- XML-Parser-Logik für Backend vorbereiten

### 3. Integration in bestehende Anwendung
- `MessageItem.tsx` erweitern, um Tenant-Renderer zu unterstützen
- Backend-Änderungen für strukturierte Datenlieferung vorbereiten

### 4. Admin-Integration
- UI-Komponenten für Tenant-Konfiguration erstellen
- Speicherlogik für Konfigurationen implementieren

### 5. Testumgebung
- Dev-Tools für lokales Testen implementieren
- Test-Daten für verschiedene Tenants vorbereiten

## Lokales Testen

Für lokales Testen werden Dev-Tools bereitgestellt, mit denen:
1. Zwischen verschiedenen Tenants gewechselt werden kann
2. Test-Daten für strukturierte Inhalte generiert werden können
3. Die Rendering-Ergebnisse visualisiert werden können

```tsx
// Beispiel für Dev-Tools-Nutzung
localStorage.setItem('devTenantId', 'brandenburg');
```

## Admin-Integration

Im Admin-Bereich wird eine Konfigurationskomponente bereitgestellt, mit der pro Tenant:
1. Der zu verwendende Renderer ausgewählt werden kann
2. Spezifische Einstellungen für den Renderer vorgenommen werden können
3. Test-Darstellungen der Renderer angezeigt werden können

## Datenmodelle

### Brandenburg Schul-Datenmodell

```typescript
interface BrandenburgSchool {
  name: string;
  type: string;
  schoolId?: string;
  address?: string;
  management?: string; // Schulleitung
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  details?: {
    allDayCare?: boolean; // Ganztagsschule
    additionalInfo?: string;
  };
}
```

### Brandenburg Amt-Datenmodell

```typescript
interface BrandenburgOffice {
  name: string;
  department?: string;
  address?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  openingHours?: string;
  services?: string[];
}
```

## XML-Verarbeitung (Backend)

Die XML-Datei von Brandenburg wird wie folgt verarbeitet:

1. Regelmäßiger Import der XML-Datei
2. Parsing und Kategorisierung der Daten
3. Strukturierte Speicherung in Weaviate
4. Bereitstellung der strukturierten Daten über die Chatbot-API

## Erweiterte Chatbot-Antwort-Struktur

```typescript
interface ChatbotResponse {
  text: string;
  structured_data?: Array<{
    type: string;  // z.B. "school", "office", "event"
    data: any;     // Die strukturierten Daten
  }>;
}
```

## Nächste Schritte

1. Grundlegende Struktur implementieren
2. Brandenburg-Renderer für Schulen entwickeln
3. Integration in `MessageItem.tsx` testen
4. Backend-Integration vorbereiten
5. Weitere Renderer für Brandenburg hinzufügen
6. Admin-Konfiguration entwickeln 