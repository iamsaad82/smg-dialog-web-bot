/**
 * Hilfsfunktionen für UI-Komponenten
 */
import { BotResponse, InteractiveElement } from './types';

/**
 * Generiert eine zufällige ID für Regeln oder andere Elemente
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Parst eine Bot-Antwort und extrahiert interaktive Elemente.
 * Unterstützt sowohl JSON-Antworten als auch reinen Text.
 */
export function parseBotResponse(response: string): BotResponse {
  // Wenn die Antwort leer ist, gib einen Standardtext zurück
  if (!response.trim()) {
    return { text: 'Keine Antwort vom Bot.' };
  }
  
  try {
    // Versuche, die Antwort als JSON zu parsen
    // Der erste Versuch ist für explizite JSON-Antworten
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Wenn component und data Felder vorhanden sind, handelt es sich um eine einzelne Komponente
        if (parsed.component && parsed.data) {
          return {
            text: parsed.text || 'Der Bot hat geantwortet:',
            components: [
              {
                type: parsed.component,
                data: parsed.data
              }
            ]
          };
        }
        
        // Wenn components vorhanden ist, verwende es direkt
        if (parsed.components && Array.isArray(parsed.components)) {
          return {
            text: parsed.text || 'Der Bot hat geantwortet:',
            components: parsed.components
          };
        }
        
        // Ansonsten gib einfach den Text zurück
        return {
          text: parsed.text || 'Der Bot hat geantwortet:'
        };
      } catch (e) {
        // Wenn das JSON-Parsing fehlschlägt, behandle es als normalen Text
      }
    }
    
    // Wenn keine interaktiven Elemente gefunden wurden, gib den Text zurück
    return { text: response };
  } catch (error) {
    console.error('Fehler beim Parsen der Bot-Antwort:', error);
    return { text: response };
  }
}

/**
 * Generiert einen Prompt basierend auf Basistext und Komponenten-Regeln
 */
export function generatePrompt(basePrompt: string, rules: any[]): string {
  let prompt = basePrompt + '\n\n';
  
  // Komponenten Regeln hinzufügen
  prompt += '## Regeln für UI-Komponenten\n\n';
  
  // Aktive Regeln filtern
  const activeRules = rules.filter(rule => rule.isEnabled);
  
  if (activeRules.length === 0) {
    prompt += 'Keine speziellen UI-Komponenten sind aktiviert. Antworte in normalem Text.\n\n';
  } else {
    activeRules.forEach((rule, index) => {
      prompt += `${index + 1}. Wenn ein Nutzer nach ${rule.triggers.join(', ')} fragt, verwende die ${rule.component}-Komponente.\n`;
    });
  }
  
  // Formatierungsanweisung hinzufügen
  prompt += '\nFormatiere deine Antworten als JSON mit dem folgenden Format, wenn eine UI-Komponente verwendet werden soll:\n';
  prompt += '{\n';
  prompt += '  "text": "Deine Textantwort hier",\n';
  prompt += '  "component": "KomponentenName",\n';
  prompt += '  "data": { ... komponentenspezifische Daten ... }\n';
  prompt += '}\n';
  
  return prompt;
} 