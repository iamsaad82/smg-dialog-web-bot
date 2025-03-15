import React from 'react';
import { getRendererForTenant } from '../tenant-renderers';

/**
 * Erkennt und formatiert Links, Telefonnummern, E-Mail-Adressen und andere
 * strukturierte Daten im Text.
 */
function applyBasicFormatting(text: string): string {
  if (!text) return '';
  
  // Links formatieren
  // Erkennt URLs und macht sie zu HTML-Links
  let formattedText = text.replace(
    /(https?:\/\/[^\s]+)/g, 
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );
  
  // Telefonnummern formatieren
  // Erkennt verschiedene Telefonformate und formatiert sie einheitlich
  formattedText = formattedText.replace(
    /(\(?\d{3,5}\)?[\s.-]?\d{3,5}[\s.-]?\d{2,5}[\s.-]?\d{0,5})/g,
    '<a href="tel:$1" class="text-primary hover:underline">$1</a>'
  );
  
  // E-Mail-Adressen formatieren
  formattedText = formattedText.replace(
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    '<a href="mailto:$1" class="text-primary hover:underline">$1</a>'
  );
  
  // Absätze formatieren (leere Zeilen in <p>-Tags umwandeln)
  formattedText = '<p>' + formattedText.replace(/\n\s*\n/g, '</p><p>') + '</p>';
  
  // Einzelne Zeilenumbrüche in <br>-Tags umwandeln
  formattedText = formattedText.replace(/\n/g, '<br>');
  
  return formattedText;
}

/**
 * Analysiert den Inhalt, um zu entscheiden, ob tenant-spezifische Layouts verwendet werden sollten.
 * 
 * @param content Der zu analysierende Inhalt
 * @returns Ein Objekt mit Informationen zum Content-Typ und ggf. strukturierten Daten
 */
function analyzeContent(content: string): { 
  contentType: string | null;
  structuredData: any | null;
} {
  // Standardwert: kein spezifischer Content-Typ
  let result: { contentType: string | null; structuredData: any | null } = { 
    contentType: null, 
    structuredData: null 
  };
  
  // Versuche, JSON zu erkennen
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      const jsonData = JSON.parse(content);
      
      // Wenn das JSON einen "type"-Feld hat, nutzen wir das als Content-Typ
      if (jsonData.type) {
        result.contentType = jsonData.type as string;
        result.structuredData = jsonData;
        return result;
      }
    } catch (e) {
      // Kein gültiges JSON, ignorieren
    }
  }

  // Einfache Heuristiken für Content-Typen
  // Schulen
  if (/schule|grundschule|oberschule|gymnasium/i.test(content)) {
    result.contentType = 'school' as string;
  } 
  // Ämter/Behörden
  else if (/amt|behörde|bürgerbüro|rathaus/i.test(content)) {
    result.contentType = 'office' as string;
  }
  // Dienstleistungen
  else if (/service|dienstleistung|angebot|beratung/i.test(content)) {
    result.contentType = 'service' as string;
  }
  // Lokale Vorschriften
  else if (/vorschrift|verordnung|gesetz|regelung/i.test(content)) {
    result.contentType = 'local_law' as string;
  }
  // Kindergärten
  else if (/kindergarten|kita|krippe|kindertagesstätte/i.test(content)) {
    result.contentType = 'kindergarten' as string;
  }
  // Webseiten
  else if (/webseite|homepage|website|internetseite/i.test(content)) {
    result.contentType = 'webpage' as string;
  }
  // Abfallwirtschaft
  else if (/abfall|müll|recycling|entsorgung/i.test(content)) {
    result.contentType = 'waste_management' as string;
  }
  
  return result;
}

/**
 * Rendert formatierten Inhalt mit Unterstützung für Tenant-spezifische Layouts.
 * Diese Funktion kann erweitert werden, um verschiedene Formatierungen zu unterstützen,
 * wie Markdown, HTML oder spezielle Tenant-spezifische Layouts.
 * 
 * @param content Der zu formatierende Inhalt
 * @param tenantId Optional: Die ID des Tenants für tenant-spezifische Layouts
 * @returns Der formatierte Inhalt, ggf. mit tenant-spezifischem Layout
 */
export function renderFormattedContent(content: string, tenantId?: string): string {
  if (!content) return '';
  
  // Schritt 1: Inhalt analysieren
  const { contentType, structuredData } = analyzeContent(content);
  
  // Schritt 2: Grundlegende Formatierung anwenden (für alle Tenants gleich)
  const formattedText = applyBasicFormatting(content);
  
  // Schritt 3: Wenn ein spezifischer Tenant und Content-Typ vorliegt, 
  // prüfen, ob ein spezielles Layout verfügbar ist
  if (tenantId && contentType) {
    try {
      // Hier könnte ein spezielles Layout zurückgegeben werden, wenn verfügbar
      // Für jetzt geben wir den formatierten Text zurück
      console.log(`Tenant-spezifisches Layout für ${tenantId}/${contentType} könnte hier angewendet werden`);
      
      // In der vollständigen Implementierung würde hier der entsprechende Renderer aufgerufen:
      // const TenantRenderer = getRendererForTenant(tenantId, contentType);
      // return <TenantRenderer data={structuredData} />;
    } catch (e) {
      console.error('Fehler beim Anwenden des tenant-spezifischen Layouts:', e);
    }
  }
  
  // Fallback: Formatierter Text ohne spezielles Layout
  return formattedText;
} 