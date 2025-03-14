import React from 'react';
import { TenantRendererProps } from '../../types';
import { BrandenburgService } from '../types';
import { Briefcase, Globe, Info, Building, CreditCard, Zap } from 'lucide-react';

/**
 * Renderer für Dienstleistungsinformationen aus Brandenburg
 */
export const ServiceRenderer: React.FC<TenantRendererProps> = ({ data, className }) => {
  // Cast zu spezifischem Typ
  const service = data.data as BrandenburgService;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full ${className || ''}`}>
      {/* Header mit Dienstleistungstitel */}
      <div className="flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-gray-700">
        <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {service.name}
        </h3>
      </div>
      
      {/* Informationsbereich */}
      <div className="grid grid-cols-1 gap-3">
        {/* Zuständiges Amt */}
        {service.office && (
          <InfoRow 
            icon={<Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Zuständig" 
            value={service.office} 
          />
        )}
        
        {/* Link */}
        {service.link && (
          <InfoRow 
            icon={<Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Webseite" 
            value={service.link} 
            type="website" 
          />
        )}
        
        {/* Status-Badges */}
        <div className="flex flex-wrap gap-2 mt-1">
          {service.isPaid !== undefined && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              service.isPaid 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800/30 dark:text-yellow-400' 
                : 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400'
            }`}>
              <CreditCard className="h-3 w-3 mr-1" />
              {service.isPaid ? 'Kostenpflichtig' : 'Kostenlos'}
            </span>
          )}
          
          {service.isOnline !== undefined && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              service.isOnline 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/30 dark:text-blue-400' 
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400'
            }`}>
              <Zap className="h-3 w-3 mr-1" />
              {service.isOnline ? 'Online verfügbar' : 'Vor Ort'}
            </span>
          )}
        </div>
      </div>
      
      {/* Beschreibung */}
      {service.description && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {service.description}
            </p>
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