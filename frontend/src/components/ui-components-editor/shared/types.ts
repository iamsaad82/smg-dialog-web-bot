/**
 * Gemeinsame Typdefinitionen für UI-Komponenten
 */

// Eine Regel, die definiert, welche Komponente bei welchen Triggern verwendet werden soll
export interface ComponentRule {
  id: string;
  component: string;
  triggers: string[];
  isEnabled: boolean;
}

// Konfiguration für die UI-Komponenten (Prompt + Regeln)
export interface UIComponentsConfig {
  prompt: string;
  rules: ComponentRule[];
}

// Definition einer UI-Komponente
export interface ComponentDefinition {
  id: string;
  name: string;
  description: string | null;
  example_format: string;
  created_at: string;
  updated_at: string;
}

// Interaktives Element für die Vorschau
export interface InteractiveElement {
  type: string;
  data: any;
}

// Antwort des Bots mit möglichen interaktiven Elementen
export interface BotResponse {
  text: string;
  components?: InteractiveElement[];
}

// Konversationshistorie für die Vorschau
export interface ChatMessage {
  role: string;
  content: string;
  components?: InteractiveElement[];
} 