import React from 'react';
import { TenantRendererProps } from '../../types';
import { BrandenburgSchool } from '../types';
import { School, Phone, Mail, Globe, MapPin, User } from 'lucide-react';

/**
 * Renderer für Schulinformationen aus Brandenburg
 */
export const SchoolRenderer: React.FC<TenantRendererProps> = ({ data, className }) => {
  // Cast zu spezifischem Typ
  const school = data.data as BrandenburgSchool;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full ${className || ''}`}>
      {/* Header mit Schultitel */}
      <div className="flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-gray-700">
        <School className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {school.name}
        </h3>
      </div>
      
      {/* Informationsbereich */}
      <div className="grid grid-cols-1 gap-3">
        {/* Schulform */}
        {school.type && (
          <InfoRow 
            icon={<School className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Schulform" 
            value={school.type} 
          />
        )}
        
        {/* Schulleitung */}
        {school.management && (
          <InfoRow 
            icon={<User className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Schulleitung" 
            value={school.management} 
          />
        )}
        
        {/* Adresse */}
        {school.address && (
          <InfoRow 
            icon={<MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Adresse" 
            value={school.address} 
          />
        )}
        
        {/* Telefonnummer */}
        {school.contact?.phone && (
          <InfoRow 
            icon={<Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Telefon" 
            value={school.contact.phone} 
            type="phone" 
          />
        )}
        
        {/* E-Mail */}
        {school.contact?.email && (
          <InfoRow 
            icon={<Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="E-Mail" 
            value={school.contact.email} 
            type="email" 
          />
        )}
        
        {/* Website */}
        {school.contact?.website && (
          <InfoRow 
            icon={<Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Website" 
            value={school.contact.website} 
            type="website" 
          />
        )}
        
        {/* Ganztagsschule-Badge */}
        {school.details?.allDayCare && (
          <div className="col-span-2 mt-1">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-400">
              Ganztagsschule
            </span>
          </div>
        )}
      </div>
      
      {/* Zusätzliche Informationen */}
      {school.details?.additionalInfo && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {school.details.additionalInfo}
          </p>
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