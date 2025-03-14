import React from 'react';
import { ExternalLink } from 'lucide-react';
import { LinkItem } from '../utils/types';

// Card-Komponente für Links mit verbessertem Design
export const LinkCard = ({ url, title }: LinkItem) => {
  // Domain aus der URL extrahieren
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain.replace(/^www\./, ''); // www. entfernen, falls vorhanden
    } catch (e) {
      return url;
    }
  };
  
  // Farbschema basierend auf URL-Typ
  const getColorScheme = (url: string) => {
    if (url.includes('brandenburg')) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-500 dark:text-blue-400'
      };
    } else if (url.includes('service') || url.includes('dienstleistung')) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-500 dark:text-green-400'
      };
    } else {
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
        icon: 'text-gray-500 dark:text-gray-400'
      };
    }
  };
  
  const colors = getColorScheme(url);
  const domain = getDomain(url);
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-full ${colors.bg} rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${colors.border}`}
      aria-label={`Besuchen Sie ${title} - Öffnet in einem neuen Tab`}
    >
      <div className="p-4">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.border} mr-3`}>
            <ExternalLink className={`h-5 w-5 ${colors.icon}`} />
          </div>
          <div className="flex-1">
            <h4 className={`font-medium text-sm ${colors.text}`}>{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center">
              <span>{domain}</span>
              <span className="inline-flex items-center ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                Externe Webseite
              </span>
            </p>
          </div>
        </div>
      </div>
    </a>
  );
}; 