import React from 'react';
import { formatTextWithBoldReact as formatTextWithBold } from '../utils/formatters';

interface NumberedCardContentProps {
  number: string;
  title: string;
  content: string;
}

// Spezieller Stil für nummerierte Cards mit fettgedrucktem Titel und blauer Nummer im Kreis
export const NumberedCardContent = ({ 
  number, 
  title, 
  content 
}: NumberedCardContentProps) => {
  // Sicherstellen, dass kein Doppelpunkt am Ende des Titels steht
  const cleanTitle = title.endsWith(':') ? title.slice(0, -1) : title;
  
  return (
    <div className="rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800/30 mb-3 relative shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center p-4 pb-2">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium text-sm mr-3 shadow-sm">
          {number}
        </div>
        <h3 className="text-sm font-bold">{cleanTitle}</h3>
      </div>
      <div className="px-4 pb-4 text-sm leading-relaxed">
        <div className="ml-11">
          {formatTextWithBold(content)}
        </div>
      </div>
    </div>
  );
}; 