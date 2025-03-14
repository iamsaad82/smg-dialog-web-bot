import React from 'react';
import { TenantRendererProps } from '../../types';
import { BrandenburgLocalLaw } from '../types';
import { BookOpen, Globe, Info, FileText } from 'lucide-react';

/**
 * Renderer für Ortsrechtinformationen aus Brandenburg
 */
export const LocalLawRenderer: React.FC<TenantRendererProps> = ({ data, className }) => {
  // Cast zu spezifischem Typ
  const localLaw = data.data as BrandenburgLocalLaw;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full ${className || ''}`}>
      {/* Header mit Ortsrechttitel */}
      <div className="flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-gray-700">
        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {localLaw.title}
        </h3>
      </div>
      
      {/* Informationsbereich */}
      <div className="grid grid-cols-1 gap-3">
        {/* Link */}
        {localLaw.link && (
          <InfoRow 
            icon={<Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Dokument" 
            value={localLaw.link} 
            type="website" 
          />
        )}
      </div>
      
      {/* Beschreibung */}
      {localLaw.description && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {localLaw.description}
            </p>
          </div>
        </div>
      )}
      
      {/* Volltext (falls vorhanden) */}
      {localLaw.text && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-gray-700 dark:text-gray-300 overflow-auto max-h-40">
              {localLaw.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Helper-Komponente für Infozeilen
 */
const InfoRow: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: string;
  type?: 'text' | 'phone' | 'email' | 'website';
}> = ({ icon, label, value, type = 'text' }) => {
  let valueElement: React.ReactNode = value;
  
  // Behandlung spezieller Werttypen
  if (type === 'website') {
    valueElement = (
      <a 
        href={value.startsWith('http') ? value : `https://${value}`}
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline flex items-center"
      >
        {value}
        <Globe className="h-3 w-3 ml-1 inline" />
      </a>
    );
  } else if (type === 'email') {
    valueElement = (
      <a 
        href={`mailto:${value}`}
        className="text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  } else if (type === 'phone') {
    valueElement = (
      <a 
        href={`tel:${value.replace(/\s+/g, '')}`}
        className="text-blue-600 hover:underline"
      >
        {value}
      </a>
    );
  }
  
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
      <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] sm:text-right">
        {icon && <span className="mr-1">{icon}</span>}
        <span>{label}:</span>
      </div>
      <div className="text-sm text-gray-800 dark:text-gray-200 flex-1">
        {valueElement}
      </div>
    </div>
  );
}; 