import React from 'react';
import { formatTextWithBoldTitle } from './formatting';
import { formatTextWithBoldReact as formatTextWithBold } from './formatters';
import { NumberedStructuredContent } from '../components/NumberedStructuredContent';
import { StructuredContent } from '../components/StructuredContent';
import { LinkCardSlider } from '../components/LinkCardSlider';
import { ExternalLink } from 'lucide-react';
import { LinkItem } from './types';

/**
 * Bereinigt einen Titel oder Wert
 */
const cleanupValue = (value: string): string => {
  if (!value) return '';
  
  // Doppelte Angaben entfernen (z.B. "Gymnasium - Gymnasium")
  const duplicatePattern = /(\w+)(\s+[-:]\s+\1|[-:]\s+\1)/gi;
  let cleanValue = value.replace(duplicatePattern, '$1');
  
  // Führende oder nachfolgende Trennzeichen entfernen
  cleanValue = cleanValue.replace(/^[-:\s]+|[-:\s]+$/g, '');
  
  return cleanValue.trim();
};

/**
 * Erkennt und formatiert allgemeine strukturierte Informationen
 */
const formatStructuredInfo = (text: string): React.ReactNode => {
  // Schlüsselwörter, die auf strukturierte Infos hindeuten könnten
  const structureKeywords = [
    'Schulform', 'Schultyp', 'Gymnasium', 'Schule', 'Kontakt', 'Telefon', 
    'E-Mail', 'Adresse', 'Website', 'Webseite', 'Schulleitung'
  ];
  
  // Grundlegende Eigenschaft prüfen: Hat das Format Schlüssel-Wert-Paare?
  const hasKeyValuePairs = text.split('\n')
    .filter(line => line.includes(':') && structureKeywords.some(kw => line.includes(kw)))
    .length >= 2;

  // Hat der Text einen Titel/Header?
  const hasHeaderMarker = text.includes('###');
  const firstLine = text.split('\n')[0]?.trim() || '';
  const hasTitleAtStart = !firstLine.includes(':') && 
                         (firstLine.length > 0) &&
                         structureKeywords.some(kw => text.includes(kw));
  
  // Prüfung auf bekannte Institutionen oder Einrichtungen
  const containsInstitutionKeywords = [
    'Gymnasium', 'Schule', 'Schulform', 'Schulleitung', 'Bertolt', 'Brecht'
  ].some(kw => text.toLowerCase().includes(kw.toLowerCase()));
  
  // Entscheidung, ob strukturierte Information vorliegt
  const isStructuredInfo = (hasKeyValuePairs && (hasHeaderMarker || hasTitleAtStart)) || 
                          (containsInstitutionKeywords && hasKeyValuePairs);
  
  if (isStructuredInfo) {
    // Format mit sauberen Key-Value-Paaren erstellen
    const lines = text.split('\n');
    const structuredData: Record<string, string> = {};
    let title = '';
    
    // Titel aus den ersten Zeilen extrahieren
    if (hasHeaderMarker) {
      // Titel aus Header-Format extrahieren: ### Titel
      const titleMatch = text.match(/^###\s+(.+?)(?:\s*[-:]\s*|$)/m);
      if (titleMatch) {
        title = cleanupValue(titleMatch[1]);
      }
    } else if (hasTitleAtStart || containsInstitutionKeywords) {
      // Erste Zeile als Titel verwenden, wenn sie nicht als Schlüssel-Wert-Paar formatiert ist
      if (!firstLine.includes(':')) {
        title = cleanupValue(firstLine);
        // Titel aus Zeilen entfernen
        lines.shift();
      } else {
        // Institutionsname suchen (z.B. "Bertolt-Brecht-Gymnasium")
        const institutionMatch = text.match(/(?:^|\n)(?:\*\*)?([^:]*?Gymnasium|[^:]*?Schule)(?:\*\*)?(?=\s*[-:]\s*|\n|$)/);
        if (institutionMatch) {
          title = cleanupValue(institutionMatch[1]);
        }
      }
    }
    
    // Bekannte Schlüssel für Informationsstrukturen
    const knownKeys = [
      'Schulform', 'Schultyp', 'Adresse', 'Telefon', 'E-Mail', 'Website', 
      'Schulname', 'Schulleitung', 'Träger', 'Öffnungszeiten', 'Ansprechpartner', 
      'Kontakt', 'Standort', 'Beschreibung', 'Information', 'Hinweis', 'Details',
      'Leistungen', 'Anmeldung', 'Gebühren', 'Kosten', 'Öffnungszeit', 'Ganztag',
      'Ganztagsschule'
    ];
    
    // Schlüssel-Wert-Paare aus dem Text extrahieren
    const keyValueRegex = /(?:^|\n)\s*(?:\*\*)?([^:*]+?)(?:\*\*)?:\s*(?:\*\*)?(.+?)(?:\*\*)?(?=\n|$)/g;
    let match;
    
    while ((match = keyValueRegex.exec(text)) !== null) {
      let key = cleanupValue(match[1]);
      let value = match[2].trim();
      
      // Falls der Wert nochmals einen Schlüssel enthält, diesen entfernen
      knownKeys.forEach(knownKey => {
        const duplicateKeyRegex = new RegExp(`^${knownKey}:\\s*`, 'i');
        if (duplicateKeyRegex.test(value)) {
          value = value.replace(duplicateKeyRegex, '');
        }
      });
      
      value = cleanupValue(value);
      
      // Vorhandene Werte für den gleichen Schlüssel zusammenführen
      if (structuredData[key]) {
        // Nur hinzufügen, wenn der Wert nicht bereits vorhanden ist
        if (!structuredData[key].includes(value)) {
          structuredData[key] += ` - ${value}`;
        }
      } else {
        structuredData[key] = value;
      }
    }
    
    // Wenn kein Titel gefunden wurde, prüfen auf spezifische Schlüssel
    if (!title && structuredData['Name']) {
      title = structuredData['Name'];
      delete structuredData['Name'];
    } else if (!title && structuredData['Schulname']) {
      title = structuredData['Schulname'];
      delete structuredData['Schulname'];
    } else if (!title && structuredData['Schulform'] === 'Gymnasium') {
      const institutionMatch = text.match(/(?:Bertolt|Brecht)[-\s](?:Bertolt|Brecht)?[-\s]?Gymnasium/i);
      if (institutionMatch) {
        title = institutionMatch[0].trim();
      } else {
        title = 'Gymnasium';
      }
    }
    
    // Formatiertes JSX erstellen
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full">
        {title && (
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 border-gray-200 dark:border-gray-700">
            {title}
          </h3>
        )}
        
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(structuredData).map(([key, value], index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] sm:text-right">
                {key}:
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                {key.toLowerCase() === 'website' || key.toLowerCase() === 'webseite' || value.includes('http') ? (
                  <a 
                    href={value.startsWith('http') ? value : `https://${value}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 hover:underline dark:text-blue-400"
                  >
                    {value} <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                ) : key.toLowerCase() === 'e-mail' || value.includes('@') ? (
                  <a 
                    href={`mailto:${value}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400"
                  >
                    {value}
                  </a>
                ) : (
                  formatTextWithBold(value)
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return null;
};

/**
 * Rendert strukturierten oder einfachen Text mit entsprechender Formatierung
 */
export const renderFormattedContent = (content: string) => {
  // Whitespace am Anfang und Ende des Inhalts trimmen
  const trimmedContent = content.trim();
  
  // Prüfen, ob es sich um strukturierte Informationen handelt
  const structuredInfoRendering = formatStructuredInfo(trimmedContent);
  if (structuredInfoRendering) {
    return structuredInfoRendering;
  }
  
  // Standardformatierung für andere Inhalte
  return formatTextWithBoldTitle(
    trimmedContent,
    // Render für nummerierte Listen - einfacher, klarer Stil
    (sections, introText, links) => (
      <div className="space-y-2 w-full">
        {/* Nummerierte Abschnitte */}
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-sm mr-2">
                  {section.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{section.title.endsWith(':') ? section.title.slice(0, -1) : section.title}</h3>
                  {section.content && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {formatTextWithBold(section.content.trim())}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    
    // Render für Aufzählungslisten - einfacher, klarer Stil
    (sections, introText, links) => (
      <div className="space-y-2 w-full">
        {/* Aufzählungen */}
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              {section.title && (
                <h3 className="text-sm font-medium mb-2">
                  {section.title.endsWith(':') ? section.title.slice(0, -1) : section.title}
                </h3>
              )}
              
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex text-sm">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{item.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    
    // Render für einfachen Text - unkomplizierte Textdarstellung
    (text, links) => (
      <div className="w-full">
        {/* Einfacher Text */}
        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {formatTextWithBold(text.trim())}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    
    // Render für Screenshot-Format
    (sections, introText, links) => (
      <div className="space-y-2 w-full">
        {/* Nummerierte Abschnitte */}
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-sm mr-2">
                  {section.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{section.title.endsWith(':') ? section.title.slice(0, -1) : section.title}</h3>
                  {section.content && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {formatTextWithBold(section.content.trim())}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    )
  );
}; 