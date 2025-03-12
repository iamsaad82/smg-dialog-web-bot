import React, { useState } from 'react';
import { Search, ChevronRight, BookOpen, Wrench, Server, Laptop, UserCog, Copy } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Dokumentationsstruktur
interface DocSection {
  id: string;
  title: string;
  description?: string;
  icon?: React.ElementType;
  children?: DocPage[];
}

interface DocPage {
  id: string;
  title: string;
  description?: string;
  content: string;
}

export function DocumentationViewer() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('getting-started');
  const [selectedPage, setSelectedPage] = useState('welcome');

  // Dokumentationsstruktur
  const documentation: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Erste Schritte',
      icon: BookOpen,
      children: [
        {
          id: 'welcome',
          title: 'Willkommen',
          content: `
# Willkommen zum KI-Bot-System

Das KI-Bot-System ist eine moderne Lösung für die Erstellung und Verwaltung von intelligenten Chatbots für verschiedene Branchen und Anwendungsfälle.

## Hauptfunktionen

- **Multi-Tenant-Architektur**: Isolierte Umgebungen für jeden Kunden
- **Retrieval-Augmented Generation (RAG)**: Kombination von Weaviate und LLM (GPT-4 oder Mistral)
- **Hybride Suche**: Vektorsuche + Schlüsselwortsuche für maximale Relevanz
- **UI-Komponenten-System**: Interaktive Elemente für ansprechende Bot-Antworten

## Erste Schritte

1. Melden Sie sich mit Ihren Administrator-Anmeldedaten an
2. Erkunden Sie das Dashboard, um einen Überblick zu erhalten
3. Erstellen Sie Ihren ersten Tenant
4. Fügen Sie Dokumente hinzu, um die Wissensbasis des Bots zu erstellen
5. Konfigurieren Sie UI-Komponenten für ansprechende Antworten

Folgen Sie den Anweisungen in diesem Dokumentationsbereich, um detaillierte Informationen zu erhalten.
          `
        },
        {
          id: 'installation',
          title: 'Installation',
          content: `
# Installation des KI-Bot-Systems

Das KI-Bot-System kann einfach mit Docker und Docker Compose installiert werden.

## Voraussetzungen

- Docker und Docker Compose
- OpenAI API-Schlüssel (optional: Mistral API-Schlüssel)
- Internetzugang für den Download der Container-Images

## Installationsschritte

1. **Repository klonen**

   \`\`\`bash
   git clone https://github.com/company/ki-bot-system.git
   cd ki-bot-system
   \`\`\`

2. **Umgebungsvariablen konfigurieren**

   Erstellen Sie eine \`.env\`-Datei im Hauptverzeichnis:

   \`\`\`env
   OPENAI_API_KEY=your_openai_api_key
   MISTRAL_API_KEY=your_mistral_api_key
   \`\`\`

3. **System starten**

   \`\`\`bash
   docker-compose up -d
   \`\`\`

4. **Auf das System zugreifen**

   - Admin-Dashboard: http://localhost:3000
   - API-Dokumentation: http://localhost:8000/docs

## Aktualisierung

Um das System zu aktualisieren, führen Sie folgende Befehle aus:

\`\`\`bash
git pull
docker-compose down
docker-compose up -d
\`\`\`
          `
        },
        {
          id: 'quick-start',
          title: 'Schnellstart',
          content: `
# Schnellstart-Anleitung

Folgen Sie diesen Schritten, um schnell mit dem KI-Bot-System zu beginnen.

## 1. Tenant erstellen

1. Gehen Sie zum Dashboard und klicken Sie auf "Tenant erstellen"
2. Geben Sie einen Namen und eine Beschreibung ein
3. Wählen Sie die gewünschten Einstellungen
4. Klicken Sie auf "Speichern"

## 2. Dokumente hochladen

1. Gehen Sie zur Dokument-Verwaltung des erstellten Tenants
2. Klicken Sie auf "Dokumente hochladen"
3. Wählen Sie Dateien aus (unterstützte Formate: PDF, DOCX, CSV, JSON, Markdown)
4. Warten Sie, bis die Dokumente verarbeitet wurden

## 3. UI-Komponenten konfigurieren

1. Gehen Sie zu den UI-Komponenten-Einstellungen
2. Wählen Sie die gewünschten Komponenten aus
3. Konfigurieren Sie die Trigger-Wörter
4. Testen Sie die Komponenten in der Vorschau

## 4. Bot einbetten

1. Gehen Sie zu den Einbettungs-Einstellungen
2. Kopieren Sie den Einbettungscode
3. Fügen Sie den Code in Ihre Website ein

## 5. Bot testen

1. Öffnen Sie die Chat-Vorschau
2. Stellen Sie Fragen, um den Bot zu testen
3. Überprüfen Sie die Antworten und UI-Komponenten
          `
        }
      ]
    },
    {
      id: 'admin-guide',
      title: 'Administratorhandbuch',
      icon: UserCog,
      children: [
        {
          id: 'admin-overview',
          title: 'Übersicht',
          content: `
# Administratorhandbuch - Übersicht

Dieses Handbuch richtet sich an Systemadministratoren, die das KI-Bot-System verwalten.

## Zuständigkeiten des Administrators

- **Systemkonfiguration**: Einrichtung und Wartung des Gesamtsystems
- **Tenant-Verwaltung**: Erstellung und Verwaltung von Tenant-Accounts
- **Systempflege**: Updates, Backups und Monitoring
- **Fehlerbehebung**: Diagnose und Lösung von Systemproblemen

## Wichtige Abschnitte

- **System-Einstellungen**: Konfiguration der grundlegenden Systemparameter
- **Benutzer- und Rollenverwaltung**: Verwaltung von Administratoren und Redakteuren
- **Systemlogs**: Überwachung und Analyse von Systemereignissen
- **Backup und Wiederherstellung**: Datensicherung und Disaster Recovery

Dieses Handbuch bietet detaillierte Anweisungen für jede dieser Aufgaben.
          `
        },
        {
          id: 'user-management',
          title: 'Benutzerverwaltung',
          content: `
# Benutzerverwaltung

Als Administrator können Sie Benutzer und ihre Rollen im System verwalten.

## Benutzerrollen

Das System unterstützt die folgenden Rollen:

- **Systemadministrator**: Vollständiger Zugriff auf alle Funktionen
- **Tenant-Administrator**: Verwaltung eines bestimmten Tenants
- **Redakteur**: Bearbeitung von Inhalten für einen bestimmten Tenant
- **Beobachter**: Nur-Lese-Zugriff auf Statistiken und Berichte

## Benutzer hinzufügen

1. Gehen Sie zu "Einstellungen" > "Benutzerverwaltung"
2. Klicken Sie auf "Neuer Benutzer"
3. Geben Sie E-Mail, Name und andere Details ein
4. Weisen Sie eine Rolle zu
5. Optional: Tenant-Zuordnungen festlegen
6. Klicken Sie auf "Speichern"

## Benutzer bearbeiten

1. Finden Sie den Benutzer in der Liste
2. Klicken Sie auf das Bearbeiten-Symbol
3. Nehmen Sie die gewünschten Änderungen vor
4. Klicken Sie auf "Speichern"

## Benutzer deaktivieren

Anstatt Benutzer zu löschen, sollten Sie sie deaktivieren:

1. Finden Sie den Benutzer in der Liste
2. Klicken Sie auf "Deaktivieren"
3. Bestätigen Sie die Aktion

Deaktivierte Benutzer können sich nicht mehr anmelden, ihre Daten bleiben jedoch erhalten.
          `
        }
      ]
    },
    {
      id: 'tenant-guide',
      title: 'Tenant-Handbuch',
      icon: Laptop,
      children: [
        {
          id: 'tenant-overview',
          title: 'Übersicht',
          content: `
# Tenant-Handbuch - Übersicht

Dieses Handbuch richtet sich an Tenant-Administratoren und Redakteure, die einen Tenant im KI-Bot-System verwalten.

## Was ist ein Tenant?

Ein Tenant ist eine isolierte Umgebung für einen Kunden. Jeder Tenant hat:

- Eigene Wissensbasis (Dokumente)
- Eigene Konfiguration
- Eigene Bot-Einstellungen
- Eigene UI-Komponenten

## Hauptaufgaben eines Tenant-Administrators

- **Dokumentverwaltung**: Hochladen und Organisieren von Dokumenten
- **Bot-Konfiguration**: Anpassen der Bot-Antworten und -Verhalten
- **UI-Komponenten**: Konfiguration interaktiver Elemente
- **Redakteure verwalten**: Hinzufügen und Verwalten von Redakteuren

## Für Redakteure

Redakteure können:

- Dokumente hochladen und bearbeiten
- Bot-Prompt anpassen
- UI-Komponenten konfigurieren
- Bot-Antworten testen und optimieren

Die folgenden Abschnitte enthalten detaillierte Anleitungen für jede dieser Aufgaben.
          `
        },
        {
          id: 'document-management',
          title: 'Dokumentverwaltung',
          content: `
# Dokumentverwaltung

Die Dokumentverwaltung ermöglicht das Hochladen, Organisieren und Verwalten von Dokumenten, die die Wissensbasis des Bots bilden.

## Unterstützte Dokumentformate

- PDF (.pdf)
- Word (.docx)
- Excel (.xlsx)
- CSV (.csv)
- JSON (.json)
- Markdown (.md)
- Text (.txt)

## Dokumente hochladen

1. Gehen Sie zur Dokument-Verwaltung Ihres Tenants
2. Klicken Sie auf "Dokumente hochladen"
3. Wählen Sie Dateien aus oder ziehen Sie sie per Drag & Drop in den Upload-Bereich
4. Fügen Sie optional Metadaten hinzu
5. Klicken Sie auf "Hochladen"
6. Warten Sie, bis die Dokumente verarbeitet wurden

## Dokumente organisieren

Verwenden Sie Tags und Kategorien, um Dokumente zu organisieren:

1. Wählen Sie ein oder mehrere Dokumente aus
2. Klicken Sie auf "Tags bearbeiten" oder "Kategorie zuweisen"
3. Wählen Sie bestehende Tags/Kategorien oder erstellen Sie neue
4. Klicken Sie auf "Speichern"

## Dokumente aktualisieren

1. Finden Sie das Dokument in der Liste
2. Klicken Sie auf "Bearbeiten"
3. Laden Sie eine neue Version hoch oder bearbeiten Sie die Metadaten
4. Klicken Sie auf "Speichern"

## Dokumente löschen

1. Wählen Sie ein oder mehrere Dokumente aus
2. Klicken Sie auf "Löschen"
3. Bestätigen Sie die Aktion

Hinweis: Das Löschen von Dokumenten kann einige Zeit dauern, da auch die zugehörigen Embeddings in der Vector-Datenbank gelöscht werden müssen.
          `
        }
      ]
    },
    {
      id: 'ui-components',
      title: 'UI-Komponenten',
      icon: Wrench,
      children: [
        {
          id: 'ui-components-overview',
          title: 'Übersicht',
          content: `
# UI-Komponenten - Übersicht

UI-Komponenten sind interaktive Elemente, die in Bot-Antworten angezeigt werden können. Sie machen die Bot-Antworten ansprechender und interaktiver.

## Vorteile von UI-Komponenten

- **Verbesserte Benutzererfahrung**: Strukturierte und ansprechende Darstellung von Informationen
- **Bessere Interaktion**: Interaktive Elemente wie Karten, Tabellen und Buttons
- **Branchenspezifische Layouts**: Anpassbare Komponenten für verschiedene Anwendungsfälle

## Verfügbare Komponenten

Das System bietet mehrere vordefinierte Komponenten:

- **OpeningHoursTable**: Strukturierte Anzeige von Öffnungszeiten
- **StoreMap**: Karte mit Standortmarkierungen
- **ProductShowcase**: Darstellung von Produkten mit Bildern und Details
- **ContactCard**: Anzeige von Kontaktinformationen

## Workflow

1. **Komponenten auswählen**: Wählen Sie die relevanten Komponenten für Ihren Anwendungsfall
2. **Trigger-Wörter definieren**: Legen Sie fest, wann der Bot eine bestimmte Komponente anzeigen soll
3. **Komponenten testen**: Überprüfen Sie die Darstellung in der Vorschau
4. **Komponenten optimieren**: Passen Sie die Komponenten basierend auf Benutzerfeedback an

Die folgenden Abschnitte enthalten detaillierte Anleitungen für die Konfiguration und Verwendung der UI-Komponenten.
          `
        },
        {
          id: 'component-configuration',
          title: 'Komponenten-Konfiguration',
          content: `
# Komponenten-Konfiguration

Die Konfiguration von UI-Komponenten erfolgt über den Komponenten-Editor.

## Zugriff auf den Komponenten-Editor

1. Gehen Sie zu Ihrem Tenant-Dashboard
2. Klicken Sie auf "UI-Komponenten"
3. Wählen Sie den Tab "Konfiguration"

## Basis-Prompt anpassen

Der Basis-Prompt enthält grundlegende Anweisungen für den Bot:

1. Gehen Sie zum Tab "Basis-Prompt"
2. Bearbeiten Sie den Prompt im Editor
3. Verwenden Sie die Variablen-Vorschläge für dynamische Inhalte
4. Klicken Sie auf "Speichern"

## Komponenten-Regeln definieren

Regeln bestimmen, wann der Bot bestimmte Komponenten anzeigt:

1. Gehen Sie zum Tab "Regeln"
2. Klicken Sie auf "Neue Regel"
3. Wählen Sie eine Komponente aus
4. Definieren Sie Trigger-Wörter oder -Phrasen
5. Aktivieren/Deaktivieren Sie die Regel bei Bedarf
6. Klicken Sie auf "Speichern"

Beispiel für eine Regel:
- Komponente: OpeningHoursTable
- Trigger-Wörter: "Öffnungszeiten", "Wann geöffnet", "Wann hat ... auf"

## Komponenten testen

1. Gehen Sie zum Tab "Vorschau"
2. Stellen Sie eine Test-Frage, die einen Trigger enthält
3. Prüfen Sie, ob die richtige Komponente angezeigt wird
4. Testen Sie verschiedene Formulierungen, um die Zuverlässigkeit zu überprüfen

## Tipps für effektive Regeln

- Verwenden Sie verschiedene Formulierungen als Trigger
- Berücksichtigen Sie Tippfehler und Umgangssprache
- Definieren Sie spezifische Regeln vor allgemeinen Regeln
- Testen Sie die Regeln regelmäßig mit realen Beispielen
          `
        },
        {
          id: 'component-gallery',
          title: 'Komponenten-Galerie',
          content: `
# Komponenten-Galerie

Die Komponenten-Galerie zeigt alle verfügbaren UI-Komponenten mit Beispielen und Beschreibungen.

## OpeningHoursTable

Die OpeningHoursTable-Komponente zeigt Öffnungszeiten in einem strukturierten, leicht lesbaren Format an.

### Beispiel-Daten:
\`\`\`json
{
  "Montag": {"open": "10:00", "close": "20:00"},
  "Dienstag": {"open": "10:00", "close": "20:00"},
  "Mittwoch": {"open": "10:00", "close": "20:00"},
  "Donnerstag": {"open": "10:00", "close": "20:00"},
  "Freitag": {"open": "10:00", "close": "21:00"},
  "Samstag": {"open": "09:00", "close": "20:00"},
  "Sonntag": {"closed": true}
}
\`\`\`

## StoreMap

Die StoreMap-Komponente zeigt Standorte oder Geschäfte auf einer Karte oder in einer Liste an.

### Beispiel-Daten:
\`\`\`json
{
  "locations": [
    {
      "name": "Elektronikmarkt",
      "floor": "EG",
      "category": "Elektronik"
    },
    {
      "name": "Buchhandlung",
      "floor": "1",
      "category": "Medien"
    }
  ]
}
\`\`\`

## ProductShowcase

Die ProductShowcase-Komponente präsentiert Produkte oder Angebote mit Bildern und Details.

### Beispiel-Daten:
\`\`\`json
{
  "products": [
    {
      "name": "Smartphone XYZ",
      "price": "599 €",
      "discountPrice": "499 €",
      "shop": "Elektronik GmbH"
    }
  ]
}
\`\`\`

## ContactCard

Die ContactCard-Komponente zeigt Kontaktinformationen in einer ansprechenden Karte an.

### Beispiel-Daten:
\`\`\`json
{
  "contacts": [
    {
      "name": "Max Mustermann",
      "title": "Information",
      "phone": "+49 123 456789",
      "email": "info@example.com"
    }
  ]
}
\`\`\`
          `
        }
      ]
    },
    {
      id: 'api-reference',
      title: 'API-Referenz',
      icon: Server,
      children: [
        {
          id: 'api-overview',
          title: 'Übersicht',
          content: `
# API-Referenz - Übersicht

Das KI-Bot-System bietet eine umfassende REST-API für die Integration mit anderen Systemen.

## API-Basis-URL

\`\`\`
http://localhost:8000/api/v1
\`\`\`

## Authentifizierung

Alle API-Anfragen erfordern einen API-Schlüssel, der im Header übergeben wird:

\`\`\`
X-API-Key: your_api_key
\`\`\`

## Fehlerbehandlung

Die API verwendet standardmäßige HTTP-Statuscodes:

- 200: OK
- 400: Ungültige Anfrage
- 401: Nicht autorisiert
- 404: Nicht gefunden
- 500: Serverfehler

Fehlerantworten enthalten ein JSON-Objekt mit Details:

\`\`\`json
{
  "detail": "Fehlerbeschreibung",
  "code": "error_code"
}
\`\`\`

## Rate Limiting

Die API unterliegt einem Rate Limiting:

- 100 Anfragen pro Minute für Chat-Endpunkte
- 1000 Anfragen pro Stunde für andere Endpunkte

Die folgenden Abschnitte enthalten detaillierte Dokumentationen für die wichtigsten API-Endpunkte.
          `
        },
        {
          id: 'chat-api',
          title: 'Chat-API',
          content: `
# Chat-API

Die Chat-API ermöglicht die Integration des Bots in externe Anwendungen.

## Completion-Endpunkt

\`\`\`
POST /chat/completion
\`\`\`

Erzeugt eine Bot-Antwort auf eine Benutzeranfrage.

### Anfrage-Parameter

\`\`\`json
{
  "messages": [
    { "role": "user", "content": "Wann habt ihr geöffnet?" }
  ],
  "stream": false,
  "custom_instructions": "Optional: Zusätzliche Anweisungen"
}
\`\`\`

### Antwort

\`\`\`json
{
  "answer": "Wir haben Montag bis Freitag von 9:00 bis 18:00 Uhr geöffnet.",
  "interactive_elements": [
    {
      "type": "opening_hours_table",
      "data": {
        "Montag": {"open": "09:00", "close": "18:00"},
        "Dienstag": {"open": "09:00", "close": "18:00"},
        "Mittwoch": {"open": "09:00", "close": "18:00"},
        "Donnerstag": {"open": "09:00", "close": "18:00"},
        "Freitag": {"open": "09:00", "close": "18:00"},
        "Samstag": {"closed": true},
        "Sonntag": {"closed": true}
      }
    }
  ]
}
\`\`\`

## Streaming-Antworten

Setzen Sie \`stream: true\` für eine gestreamte Antwort:

\`\`\`
POST /chat/completion
\`\`\`

\`\`\`json
{
  "messages": [
    { "role": "user", "content": "Wann habt ihr geöffnet?" }
  ],
  "stream": true
}
\`\`\`

Die Antwort wird als Server-Sent Events (SSE) gestreamt:

\`\`\`
data: {"token": "Wir", "finished": false}
data: {"token": " haben", "finished": false}
data: {"token": " Montag", "finished": false}
...
data: {"token": ".", "finished": true, "interactive_elements": [...]}
\`\`\`
          `
        }
      ]
    }
  ];

  // Aktuelle Seite finden
  const currentSection = documentation.find(section => section.id === selectedSection) || documentation[0];
  const currentPage = currentSection.children?.find(page => page.id === selectedPage) || currentSection.children?.[0];
  
  // Markdown als einfaches HTML rendern
  const renderMarkdown = (markdown: string) => {
    // Sehr einfache Markdown-Konvertierung für dieses Beispiel
    // In einer echten Anwendung würde man eine richtige Markdown-Bibliothek verwenden
    return markdown
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/```([^`]+)```/g, '<pre class="bg-muted p-4 rounded-md my-4 overflow-x-auto"><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/^(\d+)\. (.*$)/gm, '<li class="ml-6 list-decimal mb-1">$2</li>')
      .replace(/^- (.*$)/gm, '<li class="ml-6 list-disc mb-1">$2</li>')
      .replace(/\n\n/g, '<p class="mb-4"></p>');
  };

  // Suchergebnisse filtern
  const getSearchResults = () => {
    if (!searchTerm) return [];
    
    const results: { section: string; page: string; title: string; snippet: string }[] = [];
    
    documentation.forEach(section => {
      section.children?.forEach(page => {
        if (
          page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          page.content.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          // Textausschnitt mit Suchbegriff finden
          const contentLower = page.content.toLowerCase();
          const index = contentLower.indexOf(searchTerm.toLowerCase());
          const start = Math.max(0, index - 30);
          const end = Math.min(contentLower.length, index + searchTerm.length + 30);
          const snippet = page.content.substring(start, end).replace(
            new RegExp(`(${searchTerm})`, 'gi'), 
            '<strong class="bg-yellow-100 dark:bg-yellow-900">$1</strong>'
          );
          
          results.push({
            section: section.id,
            page: page.id,
            title: page.title,
            snippet: `...${snippet}...`
          });
        }
      });
    });
    
    return results;
  };
  
  const searchResults = getSearchResults();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Seitenleiste */}
      <div className="md:col-span-1">
        <Card className="sticky top-6">
          <CardHeader className="pb-4">
            <CardTitle>Dokumentation</CardTitle>
            <CardDescription>
              KI-Bot-System Handbuch
            </CardDescription>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Dokumentation durchsuchen..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pb-6">
            {searchTerm ? (
              // Suchergebnisse anzeigen
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Suchergebnisse</h3>
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Ergebnisse gefunden</p>
                ) : (
                  <div className="space-y-3">
                    {searchResults.map((result, i) => (
                      <div key={i} className="text-sm">
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-primary justify-start"
                          onClick={() => {
                            setSelectedSection(result.section);
                            setSelectedPage(result.page);
                            setSearchTerm('');
                          }}
                        >
                          {result.title}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: result.snippet }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Normale Navigation anzeigen
              <Accordion type="multiple" defaultValue={[documentation[0].id]}>
                {documentation.map((section) => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="text-sm hover:no-underline">
                      <div className="flex items-center text-left">
                        {section.icon && <section.icon className="h-4 w-4 mr-2" />}
                        {section.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-6 pt-2 space-y-1">
                        {section.children?.map((page) => (
                          <Button
                            key={page.id}
                            variant="ghost"
                            className={`w-full justify-start px-2 ${
                              selectedSection === section.id && selectedPage === page.id
                                ? 'bg-accent'
                                : ''
                            }`}
                            onClick={() => {
                              setSelectedSection(section.id);
                              setSelectedPage(page.id);
                            }}
                          >
                            <ChevronRight className="h-3 w-3 mr-1" />
                            <span className="text-sm">{page.title}</span>
                          </Button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inhaltsbereich */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{currentPage?.title}</CardTitle>
                <CardDescription>{currentPage?.description}</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                // Notification zeigen (in einer echten Anwendung)
              }}>
                <Copy className="h-4 w-4 mr-2" />
                Link kopieren
              </Button>
            </div>
          </CardHeader>
          <CardContent className="prose prose-slate dark:prose-invert max-w-none">
            {currentPage && (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(currentPage.content) }} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 