import { StructuredContent, BulletedSection } from './types';
import { extractNumberedSections, extractBulletPoints } from './extraction';

// Erkennt strukturierte Daten im Text
export const detectStructuredContent = (text: string): StructuredContent => {
  try {
    // Streaming-Unterstützung: Nur analysieren, wenn ausreichend Text vorhanden ist
    if (!text || text.length < 10) {
      return { type: 'simple', text };
    }
    
    // Versuche zuerst, eine einfache nummerierte Liste zu erkennen
    const numberedSections = extractNumberedSections(text);
    if (numberedSections.length > 0) {
      return { type: 'numbered', sections: numberedSections };
    }

    // Erkennung von Aufzählungspunkten
    const bulletPoints = extractBulletPoints(text);
    if (bulletPoints.length > 0) {
      return { 
        type: 'bulleted', 
        sections: [{ title: '', items: bulletPoints }] 
      };
    }
    
    // Versuch, Abschnitte mit Titeln zu identifizieren
    const sections: BulletedSection[] = [];
    const lines = text.split('\n');
    
    let currentTitle = '';
    let currentItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Verschiedene Titelformate erkennen
      const hasBoldTitle = line.includes('**') && line.includes(':');
      const hasColonTitle = /^[A-Za-z\s]+:/.test(line) && !line.startsWith('- ');
      
      if (hasBoldTitle || hasColonTitle) {
        // Vorherigen Abschnitt speichern, falls vorhanden
        if (currentTitle && currentItems.length > 0) {
          sections.push({
            title: currentTitle,
            items: [...currentItems]
          });
          currentItems = [];
        }
        
        // Extrahiere den neuen Titel
        let newTitle = '';
        let restOfLine = '';
        
        if (hasBoldTitle) {
          const titleMatch = line.match(/\*\*([^*:]+):\s*\*\*/);
          if (titleMatch && titleMatch[1]) {
            newTitle = titleMatch[1].trim();
            restOfLine = line.split('**').pop()?.trim() || '';
          }
        } else if (hasColonTitle) {
          const parts = line.split(':');
          newTitle = parts[0].trim();
          restOfLine = parts.slice(1).join(':').trim();
        }
        
        if (newTitle) {
          currentTitle = newTitle;
          
          // Rest der Zeile als erstes Element, falls vorhanden
          if (restOfLine && restOfLine.length > 0) {
            currentItems.push(restOfLine);
          }
        }
      } 
      // Sammle Listenelemente
      else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ') || 
               (currentTitle && line.length > 0)) {
        let itemText = line;
        if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
          itemText = line.substring(2);
        }
        
        if (itemText.trim().length > 0) {
          currentItems.push(itemText.trim());
        }
      }
    }
    
    // Füge den letzten Abschnitt hinzu
    if (currentTitle && currentItems.length > 0) {
      sections.push({
        title: currentTitle,
        items: currentItems
      });
    }
    
    if (sections.length > 0) {
      return { type: 'bulleted', sections };
    }
    
    // Kein strukturierter Inhalt gefunden
    return { type: 'simple', text };
  } catch (error) {
    console.error("Fehler bei der Strukturerkennung:", error);
    return { type: 'simple', text };
  }
}; 