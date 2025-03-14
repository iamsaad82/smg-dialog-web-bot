import React from 'react';
import { ExternalLink, Mail, Globe } from 'lucide-react';
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
  
  // Link-Typ ermitteln (E-Mail, Webseite, etc.)
  const getLinkType = (url: string): { type: string; icon: JSX.Element } => {
    if (url.startsWith('mailto:')) {
      return {
        type: 'E-Mail',
        icon: <Mail className="h-5 w-5" />
      };
    }
    return {
      type: 'Webseite',
      icon: <Globe className="h-5 w-5" />
    };
  };
  
  // Farbschema basierend auf URL-Typ
  const getColorScheme = (url: string) => {
    if (url.includes('brandenburg')) {
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-700 dark:text-blue-300',
        icon: 'text-blue-500 dark:text-blue-400',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
      };
    } else if (url.includes('service') || url.includes('dienstleistung')) {
      return {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-700 dark:text-green-300',
        icon: 'text-green-500 dark:text-green-400',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30'
      };
    } else if (url.startsWith('mailto:')) {
      return {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-700 dark:text-purple-300',
        icon: 'text-purple-500 dark:text-purple-400',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
      };
    } else {
      return {
        bg: 'bg-gray-50 dark:bg-gray-800',
        border: 'border-gray-200 dark:border-gray-700',
        text: 'text-gray-700 dark:text-gray-300',
        icon: 'text-gray-500 dark:text-gray-400',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-700'
      };
    }
  };
  
  const colors = getColorScheme(url);
  const domain = getDomain(url);
  const { type, icon } = getLinkType(url);
  
  // Kurzen Label-Text aus Titel generieren
  const getShortLabel = () => {
    if (title.includes('Schul')) return 'Schule';
    if (title.includes('Stadt')) return 'Stadt';
    if (title.includes('Brandenburg')) return 'Brandenburg';
    if (title.includes('Dienst')) return 'Dienst';
    if (title.includes('E-Mail')) return 'E-Mail';
    return 'Info';
  };
  
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block w-full ${colors.bg} ${colors.hover} rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border ${colors.border}`}
      aria-label={`${title} - Öffnet in einem neuen Tab`}
    >
      <div className="p-4">
        <div className="flex items-center">
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.border} mr-3`}>
            {icon}
          </div>
          <div className="flex-1">
            <h4 className={`font-medium text-sm ${colors.text}`}>{title}</h4>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
              <span title={url}>{domain}</span>
              <div className="flex items-center">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                  {getShortLabel()}
                </span>
                <ExternalLink className="h-3 w-3 ml-2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}; 