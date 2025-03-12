/**
 * Konstante Werte für UI-Komponenten
 */

// Beispiel-Komponenten-Definitionen
export const COMPONENT_EXAMPLES = {
  OpeningHoursTable: {
    description: 'Zeigt strukturierte Öffnungszeiten an.',
    triggers: ['Öffnungszeiten', 'Wann habt ihr geöffnet', 'Wann hat ... auf'],
    exampleData: {
      "Montag": {"open": "10:00", "close": "20:00"},
      "Dienstag": {"open": "10:00", "close": "20:00"},
      "Mittwoch": {"open": "10:00", "close": "20:00"},
      "Donnerstag": {"open": "10:00", "close": "20:00"},
      "Freitag": {"open": "10:00", "close": "21:00"},
      "Samstag": {"open": "09:00", "close": "20:00"},
      "Sonntag": {"closed": true}
    }
  },
  StoreMap: {
    description: 'Zeigt eine Karte oder Liste mit Geschäften/Standorten an.',
    triggers: ['Wo finde ich', 'Welche Geschäfte', 'Standort'],
    exampleData: {
      "locations": [
        {
          "name": "Elektromarkt",
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
  },
  ProductShowcase: {
    description: 'Präsentiert Produkte oder Angebote.',
    triggers: ['Angebote', 'Produkte', 'Was gibt es Neues'],
    exampleData: {
      "products": [
        {
          "name": "Smartphone XYZ",
          "price": "599 €",
          "discountPrice": "499 €",
          "shop": "Elektronik GmbH"
        }
      ]
    }
  },
  ContactCard: {
    description: 'Zeigt Kontaktinformationen an.',
    triggers: ['Kontakt', 'Ansprechpartner', 'Wen kann ich fragen'],
    exampleData: {
      "contacts": [
        {
          "name": "Max Mustermann",
          "title": "Information",
          "phone": "+49 123 456789",
          "email": "info@example.com"
        }
      ]
    }
  }
};

// Beispiel-Anfragen für die Vorschau
export const EXAMPLE_QUERIES = [
  'Was sind eure Öffnungszeiten?',
  'Wo finde ich den Elektronikmarkt?',
  'Gibt es aktuelle Angebote im Supermarkt?',
  'Wer ist der Ansprechpartner für Veranstaltungen?'
];

// Standard-Basis-Prompt
export const DEFAULT_BASE_PROMPT = 'Du bist ein hilfreicher Assistent für ein Shopping Center. Verwende spezielle UI-Komponenten, um Informationen ansprechend darzustellen.';

// Standard-Regeln für neue Tenants
export const DEFAULT_RULES = [
  { id: '1', component: 'OpeningHoursTable', triggers: ['Öffnungszeiten', 'Wann habt ihr geöffnet'], isEnabled: true },
  { id: '2', component: 'StoreMap', triggers: ['Wo finde ich', 'Welche Geschäfte'], isEnabled: true },
  { id: '3', component: 'ProductShowcase', triggers: ['Angebote', 'Produkte', 'Was gibt es Neues'], isEnabled: true },
  { id: '4', component: 'ContactCard', triggers: ['Kontakt', 'Ansprechpartner', 'Wen kann ich fragen'], isEnabled: true },
]; 