import { InteractiveElement, BotComponentResponse } from '../types/interactive';

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
    // Wenn der Text kein JSON zu sein scheint, gib den Originaltext zurück
    if (!responseText.trim().startsWith('{')) {
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
          return defaultResponse;
        }
      } else {
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
    return defaultResponse;
  }
} 