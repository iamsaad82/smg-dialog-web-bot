import React, { useState } from 'react';
import { TenantRendererProps } from '../../types';
import { BrandenburgWebpage } from '../types';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';

/**
 * Renderer für Webseiteninformationen aus Brandenburg
 */
export const WebpageRenderer: React.FC<TenantRendererProps> = ({ data, className }) => {
  // Cast zu spezifischem Typ
  const webpage = data.data as BrandenburgWebpage;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full ${className || ''}`}>
      {/* Header mit Webseitentitel */}
      <div className="flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-gray-700">
        <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {webpage.title}
        </h3>
      </div>
      
      {/* URL-Anzeige */}
      {webpage.url && (
        <div className="text-sm">
          <a 
            href={webpage.url.startsWith('http') ? webpage.url : `https://${webpage.url}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center"
          >
            {webpage.url}
            <Globe className="h-3 w-3 ml-1 inline" />
          </a>
        </div>
      )}
      
      {/* Inhalt mit Expand/Collapse */}
      {webpage.content && (
        <div className="mt-2">
          <div 
            className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer mb-2"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span>Inhalt ausblenden</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span>Inhalt anzeigen</span>
              </>
            )}
          </div>
          
          {expanded && (
            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-sm text-gray-700 dark:text-gray-300 max-h-64 overflow-y-auto">
              {webpage.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 