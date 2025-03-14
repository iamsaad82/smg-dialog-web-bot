import React from 'react';
import { formatTextWithBoldTitle } from './formatting';
import { formatTextWithBoldReact as formatTextWithBold } from './formatters';
import { NumberedStructuredContent } from '../components/NumberedStructuredContent';
import { StructuredContent } from '../components/StructuredContent';
import { LinkCardSlider } from '../components/LinkCardSlider';
import { LinkItem } from './types';

/**
 * Erkennt und formatiert strukturierte Informationen wie Schuldaten
 */
const formatStructuredInfo = (text: string): React.ReactNode => {
  // Prüfen, ob es sich um einen strukturierten Informationsblock handelt
  if (text.includes('###') || 
      (text.includes('Schulform:') && text.includes('Adresse:')) ||
      (text.includes('Gymnasium') && text.includes('Website:')) ||
      (text.includes('Schule') && text.includes('Adresse:')) ||
      (text.includes('Schulname:') || text.includes('Schultyp:'))) {
    
    // Format mit sauberen Key-Value-Paaren erstellen
    const lines = text.split('\n');
    const structuredData: Record<string, string> = {};
    let title = '';
    
    // Titel aus den ersten Zeilen extrahieren (falls vorhanden)
    if (text.startsWith('###')) {
      const titleMatch = text.match(/^###\s+(.+?)(?:\s+-\s+|$)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    } else {
      // Wenn kein expliziter Titel, erste Zeile vor einem Doppelpunkt als Titel verwenden
      const firstLine = lines[0].trim();
      if (firstLine && !firstLine.includes(':')) {
        title = firstLine;
      } else if (text.includes('Schulname:')) {
        // Schulname als Titel verwenden, wenn vorhanden
        const schulnameMatch = text.match(/Schulname:\s*(.+?)(?:\n|$)/);
        if (schulnameMatch) {
          title = schulnameMatch[1].trim();
        }
      }
    }
    
    // Bekannte Schlüssel für Schulinformationen
    const knownSchoolKeys = [
      'Schulform', 'Schultyp', 'Adresse', 'Telefon', 'E-Mail', 'Website', 
      'Schulname', 'Schulleitung', 'Träger', 'Öffnungszeiten', 'Ansprechpartner'
    ];
    
    // Key-Value-Paare erkennen und doppelte Schlüssel vermeiden
    lines.forEach(line => {
      const keyValueMatch = line.match(/([^:]+):\s*(.+)/);
      if (keyValueMatch) {
        let key = keyValueMatch[1].trim();
        const value = keyValueMatch[2].trim();
        
        // Doppelte Schlüssel im Wert erkennen und entfernen
        // z.B. "Schulform: Schulform: Gymnasium" -> "Schulform: Gymnasium"
        let cleanValue = value;
        knownSchoolKeys.forEach(knownKey => {
          const duplicateKeyRegex = new RegExp(`^${knownKey}:\\s*`, 'i');
          if (duplicateKeyRegex.test(cleanValue)) {
            cleanValue = cleanValue.replace(duplicateKeyRegex, '');
          }
        });
        
        // Wenn der Schlüssel bereits existiert, Werte zusammenführen
        if (structuredData[key]) {
          if (!structuredData[key].includes(cleanValue)) {
            structuredData[key] += ` - ${cleanValue}`;
          }
        } else {
          structuredData[key] = cleanValue;
        }
      }
    });
    
    // Wenn kein Titel gefunden wurde, aber ein Schulname in den Daten ist, diesen als Titel verwenden
    if (!title && structuredData['Schulname']) {
      title = structuredData['Schulname'];
      delete structuredData['Schulname']; // Vermeiden von Duplikaten
    }
    
    // Formatiertes JSX erstellen
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full">
        {title && (
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 border-b pb-2 border-gray-200 dark:border-gray-700">
            {title}
          </h3>
        )}
        
        <div className="grid grid-cols-1 gap-2">
          {Object.entries(structuredData).map(([key, value], index) => (
            <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-1">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                {key}:
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                {formatTextWithBold(value)}
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
  
  // Prüfen, ob es sich um strukturierte Schulinformationen handelt
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