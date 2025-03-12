import React from 'react';

interface StructuredContentProps {
  title: string;
  items: string[];
}

// Strukturierte Inhaltskomponente
export const StructuredContent = ({ title, items }: StructuredContentProps) => (
  <div className="mt-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border-l-2 border-blue-500">
    <h4 className="font-medium text-sm mb-1.5">{title}</h4>
    <ul className="space-y-1">
      {items.map((item, index) => (
        <li key={index} className="flex items-start text-sm">
          <span className="mr-2 text-blue-500">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
); 