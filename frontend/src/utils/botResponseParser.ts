import { InteractiveElement, BotComponentResponse } from '../types/interactive';

/**
 * Erkennt Öffnungszeiten-Muster in einem Text und konvertiert sie in ein strukturiertes Format
 * @param text Text, der Öffnungszeiten enthalten könnte
 * @returns Strukturierte Öffnungszeiten oder null, wenn keine erkannt wurden
 */
function detectAndStructureOpeningHours(text: string): {[key: string]: { open: string; close: string } | { closed: boolean }} | null {
  // Typische Öffnungszeitmuster suchen
  const patterns = [
    // "Dienstag: 09:00 - 12:00 Uhr und 13:00 - 18:00 Uhr"
    /([A-Za-zäöüÄÖÜß]+)(?:tag)?s?:?\s+(\d{1,2}[:\.]\d{2})\s*(?:-|–|bis)\s*(\d{1,2}[:\.]\d{2})(?:\s*Uhr)?(?:\s*und\s*(\d{1,2}[:\.]\d{2})\s*(?:-|–|bis)\s*(\d{1,2}[:\.]\d{2})(?:\s*Uhr)?)?/g,
    // "Dienstag: 09 - 12 Uhr und 13 - 18 Uhr"
    /([A-Za-zäöüÄÖÜß]+)(?:tag)?s?:?\s+(\d{1,2})\s*(?:-|–|bis)\s*(\d{1,2})(?:\s*Uhr)?(?:\s*und\s*(\d{1,2})\s*(?:-|–|bis)\s*(\d{1,2})(?:\s*Uhr)?)?/g
  ];

  // Erkennung von Wochentagen
  const dayMap: {[key: string]: string} = {
    'mo': 'Montag',
    'di': 'Dienstag',
    'mi': 'Mittwoch',
    'do': 'Donnerstag',
    'fr': 'Freitag',
    'sa': 'Samstag',
    'so': 'Sonntag',
    'mon': 'Montag',
    'die': 'Dienstag',
    'mit': 'Mittwoch',
    'don': 'Donnerstag',
    'fre': 'Freitag',
    'sam': 'Samstag',
    'son': 'Sonntag'
  };

  const structuredHours: {[key: string]: { open: string; close: string } | { closed: boolean }} = {};
  let foundMatches = false;

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      foundMatches = true;
      let [_, day, openHour1, closeHour1, openHour2, closeHour2] = match;
      
      // Wochentag normalisieren
      const dayPrefix = day.toLowerCase().substring(0, 3);
      const normalizedDay = dayMap[dayPrefix] || day;
      
      // Format mit oder ohne Doppelpunkt normalisieren (09:00 oder 9 -> 09:00)
      const normalizeTime = (time: string): string => {
        if (!time) return '';
        if (time.includes(':') || time.includes('.')) {
          // Vorhandenen Doppelpunkt/Punkt beibehalten, aber Format vereinheitlichen
          return time.padStart(5, '0').replace('.', ':');
        } else {
          // Nur Stunde -> Stunde:00 Format
          return time.padStart(2, '0') + ':00';
        }
      };

      // Erste Zeitspanne hinzufügen
      if (openHour1 && closeHour1) {
        // Wenn wir bereits einen Eintrag für diesen Tag haben, erstellen wir einen neuen mit Suffix
        if (structuredHours[normalizedDay]) {
          structuredHours[`${normalizedDay} (vormittags)`] = {
            open: normalizeTime(openHour1),
            close: normalizeTime(closeHour1)
          };
        } else {
          structuredHours[normalizedDay] = {
            open: normalizeTime(openHour1),
            close: normalizeTime(closeHour1)
          };
        }
      }

      // Zweite Zeitspanne hinzufügen (wenn vorhanden)
      if (openHour2 && closeHour2) {
        structuredHours[`${normalizedDay} (nachmittags)`] = {
          open: normalizeTime(openHour2),
          close: normalizeTime(closeHour2)
        };
      }
    }
  }

  // Suche nach "geschlossen"
  const closedPattern = /([A-Za-zäöüÄÖÜß]+)(?:tag)?s?:?\s+(?:ist\s+)?geschlossen/gi;
  let match;
  while ((match = closedPattern.exec(text)) !== null) {
    foundMatches = true;
    const [_, day] = match;
    const dayPrefix = day.toLowerCase().substring(0, 3);
    const normalizedDay = dayMap[dayPrefix] || day;
    structuredHours[normalizedDay] = { closed: true };
  }

  return foundMatches ? structuredHours : null;
}

/**
 * Versucht, eine JSON-Antwort vom Bot zu parsen,
 * die eine UI-Komponente enthalten könnte.
 * 
 * @param responseText Die Antwort des Bots als Text
 * @returns Ein Objekt mit dem Text und optionalen interaktiven Elementen
 */
export function parseBotResponse(responseText: string): {
  text: string;
  interactiveElements?: InteractiveElement[];
} {
  // Standardantwort mit originalem Text
  const defaultResponse = {
    text: responseText,
  };

  try {
    // Wenn der Text kein JSON zu sein scheint, versuchen wir Öffnungszeiten zu erkennen
    if (!responseText.trim().startsWith('{')) {
      // Versuche, Öffnungszeiten im Text zu erkennen
      const openingHours = detectAndStructureOpeningHours(responseText);
      if (openingHours && Object.keys(openingHours).length > 0) {
        console.log("Öffnungszeiten im Text erkannt:", openingHours);
        return {
          text: responseText,
          interactiveElements: [{
            type: 'opening_hours_table',
            title: 'Öffnungszeiten',
            data: openingHours
          }]
        };
      }
      return defaultResponse;
    }

    // Prüfe, ob wir einen gültigen JSON-String haben
    let jsonText = responseText.trim();
    let jsonResponse: BotComponentResponse;

    try {
      // Versuchen, die Antwort als JSON zu parsen
      jsonResponse = JSON.parse(jsonText) as BotComponentResponse;
    } catch (parseError) {
      console.warn('Fehler beim Parsen des JSON:', parseError);
      
      // Versuche, gültiges JSON zu extrahieren (für den Fall, dass zusätzlicher Text vorhanden ist)
      // Verwende einen Multiline-kompatiblen Regex ohne das 's'-Flag
      const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          jsonResponse = JSON.parse(jsonMatch[0]) as BotComponentResponse;
        } catch (nestedError) {
          console.error('Konnte kein gültiges JSON aus der Antwort extrahieren');
          
          // Versuche, Öffnungszeiten im Text zu erkennen
          const openingHours = detectAndStructureOpeningHours(responseText);
          if (openingHours && Object.keys(openingHours).length > 0) {
            console.log("Öffnungszeiten im Text erkannt nach fehlgeschlagenem JSON-Parsing:", openingHours);
            return {
              text: responseText,
              interactiveElements: [{
                type: 'opening_hours_table',
                title: 'Öffnungszeiten',
                data: openingHours
              }]
            };
          }
          
          return defaultResponse;
        }
      } else {
        // Versuche, Öffnungszeiten im Text zu erkennen
        const openingHours = detectAndStructureOpeningHours(responseText);
        if (openingHours && Object.keys(openingHours).length > 0) {
          console.log("Öffnungszeiten im Text erkannt nach fehlgeschlagenem JSON-Matching:", openingHours);
          return {
            text: responseText,
            interactiveElements: [{
              type: 'opening_hours_table',
              title: 'Öffnungszeiten',
              data: openingHours
            }]
          };
        }
        
        return defaultResponse;
      }
    }

    // Prüfen, ob es eine gültige Antwort mit Text ist
    if (!jsonResponse || typeof jsonResponse.text !== 'string') {
      console.log('Bot-Antwort enthält keine gültige Text-Eigenschaft:', jsonResponse);
      return defaultResponse;
    }

    // Wenn keine Komponente angegeben ist, nur den Text zurückgeben
    if (!jsonResponse.component) {
      return {
        text: jsonResponse.text
      };
    }

    // Je nach Komponententyp ein entsprechendes interaktives Element erstellen
    const interactiveElements: InteractiveElement[] = [];

    // Ein Fallback für nicht erkannte Komponenten
    const createFallbackElement = (component: string, data: any): InteractiveElement => {
      // Nur einfaches Info-Element erstellen
      console.warn(`Fallback für nicht erkannte Komponente: ${component}`);
      return {
        type: 'info',
        content: `Die Komponente "${component}" konnte nicht angezeigt werden. Bitte kontaktieren Sie den Administrator.`
      };
    };

    switch (jsonResponse.component) {
      case 'OpeningHoursTable':
        try {
          interactiveElements.push({
            type: 'opening_hours_table',
            title: 'Öffnungszeiten',
            data: jsonResponse.data || {},
          });
        } catch (error) {
          console.error('Fehler beim Erstellen von OpeningHoursTable:', error);
          interactiveElements.push(createFallbackElement('OpeningHoursTable', jsonResponse.data));
        }
        break;

      case 'StoreMap':
        try {
          interactiveElements.push({
            type: 'store_map',
            title: jsonResponse.data?.title || 'Geschäfte & Einrichtungen',
            locations: jsonResponse.data?.locations || [],
            highlightedLocationId: jsonResponse.data?.highlightedLocationId,
            floorplan: jsonResponse.data?.floorplan,
          });
        } catch (error) {
          console.error('Fehler beim Erstellen von StoreMap:', error);
          interactiveElements.push(createFallbackElement('StoreMap', jsonResponse.data));
        }
        break;

      case 'ProductShowcase':
        try {
          interactiveElements.push({
            type: 'product_showcase',
            title: jsonResponse.data?.title || 'Produkte & Angebote',
            products: jsonResponse.data?.products || [],
            layout: jsonResponse.data?.layout,
            showDetailsButton: jsonResponse.data?.showDetailsButton,
          });
        } catch (error) {
          console.error('Fehler beim Erstellen von ProductShowcase:', error);
          interactiveElements.push(createFallbackElement('ProductShowcase', jsonResponse.data));
        }
        break;

      case 'ContactCard':
        try {
          interactiveElements.push({
            type: 'contact_card',
            title: jsonResponse.data?.title || 'Kontakte',
            contacts: jsonResponse.data?.contacts || [],
            layout: jsonResponse.data?.layout,
            showActions: jsonResponse.data?.showActions,
          });
        } catch (error) {
          console.error('Fehler beim Erstellen von ContactCard:', error);
          interactiveElements.push(createFallbackElement('ContactCard', jsonResponse.data));
        }
        break;

      // Für unbekannte Komponenten einen Fallback anzeigen statt sie zu ignorieren
      default:
        console.warn(`Unbekannter Komponententyp: ${jsonResponse.component}`);
        interactiveElements.push(createFallbackElement(jsonResponse.component, jsonResponse.data));
        break;
    }

    return {
      text: jsonResponse.text,
      interactiveElements: interactiveElements.length > 0 ? interactiveElements : undefined
    };
  } catch (error) {
    // Wenn beim Parsen ein Fehler auftritt, den Originaltext zurückgeben
    console.error('Fehler beim Parsen der Bot-Antwort:', error);
    
    // Letzte Chance: Versuche, Öffnungszeiten im Text zu erkennen
    const openingHours = detectAndStructureOpeningHours(responseText);
    if (openingHours && Object.keys(openingHours).length > 0) {
      console.log("Öffnungszeiten im Text erkannt nach allgemeinem Fehler:", openingHours);
      return {
        text: responseText,
        interactiveElements: [{
          type: 'opening_hours_table',
          title: 'Öffnungszeiten',
          data: openingHours
        }]
      };
    }
    
    return defaultResponse;
  }
} 