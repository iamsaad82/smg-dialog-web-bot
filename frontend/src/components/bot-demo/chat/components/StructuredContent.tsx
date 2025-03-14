import React from 'react';

interface StructuredContentProps {
  title: string;
  items: string[];
}

// Strukturierte Inhaltskomponente
export const StructuredContent = ({ title, items }: StructuredContentProps) => {
  // Sicherstellen, dass kein Doppelpunkt am Ende des Titels steht
  const cleanTitle = title.endsWith(':') ? title.slice(0, -1) : title;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all duration-200">
      {cleanTitle && cleanTitle.trim().length > 0 && (
        <h3 className="text-base font-medium mb-2">{cleanTitle}</h3>
      )}
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start text-sm">
            <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs mr-2">•</span>
            <span className="text-gray-700 dark:text-gray-300">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}; 