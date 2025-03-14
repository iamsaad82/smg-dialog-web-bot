import React from 'react';
import { formatTextWithBoldReact as formatTextWithBold } from '../utils/formatters';

interface NumberedStructuredContentProps {
  number: string;
  title: string;
  content: string;
}

// Nummerierte Listenkomponente für strukturierte Inhalte mit Nummerierung
export const NumberedStructuredContent = ({ 
  number, 
  title, 
  content 
}: NumberedStructuredContentProps) => {
  // Sicherstellen, dass kein Doppelpunkt am Ende des Titels steht
  const cleanTitle = title.endsWith(':') ? title.slice(0, -1) : title;
  
  return (
    <div className="mt-3 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      <div className="flex items-start">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-medium text-sm mr-3">
          {number}
        </div>
        <h3 className="text-sm font-bold pt-1">{cleanTitle}</h3>
      </div>
      <div className="ml-11 mt-2 text-sm leading-relaxed">
        {formatTextWithBold(content)}
      </div>
    </div>
  );
}; 