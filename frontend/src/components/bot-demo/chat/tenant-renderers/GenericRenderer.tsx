import React from 'react';
import { TenantRendererProps } from './types';
import { Info } from 'lucide-react';

/**
 * Generischer Fallback-Renderer für unbekannte Datentypen
 */
export const GenericRenderer: React.FC<TenantRendererProps> = ({ data, className }) => {
  // Erstelle eine lesbare Darstellung der Daten
  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <em className="text-gray-400">-</em>;
    }
    
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return (
          <ul className="list-disc list-inside">
            {value.map((item, index) => (
              <li key={index}>{renderValue(item)}</li>
            ))}
          </ul>
        );
      }
      
      return (
        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 ml-1 mt-1 mb-1">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="mb-1">
              <span className="text-sm font-medium">{key}: </span>
              {renderValue(val)}
            </div>
          ))}
        </div>
      );
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Ja' : 'Nein';
    }
    
    // Erkennung von URLs für anklickbare Links
    if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('www.'))) {
      const url = value.startsWith('www.') ? `https://${value}` : value;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {value}
        </a>
      );
    }
    
    // Einfache Werte als Text anzeigen
    return String(value);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 w-full ${className || ''}`}>
      <div className="flex items-center mb-3 border-b pb-2 border-gray-200 dark:border-gray-700">
        <Info className="h-4 w-4 text-blue-500 mr-2" />
        <h3 className="text-sm font-medium">
          {data.type.charAt(0).toUpperCase() + data.type.slice(1)}
        </h3>
      </div>
      
      <div className="text-sm">
        {renderValue(data.data)}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
        <span>Strukturierte Daten vom Typ: {data.type}</span>
      </div>
    </div>
  );
}; 