import React from 'react';
import { TenantRendererProps } from '../../types';
import { BrandenburgOffice } from '../types';
import { Building, Phone, Mail, Globe, MapPin, Clock, List } from 'lucide-react';

/**
 * Renderer für Amtsinformationen aus Brandenburg
 */
export const OfficeRenderer: React.FC<TenantRendererProps> = ({ data, className }) => {
  // Cast zu spezifischem Typ
  const office = data.data as BrandenburgOffice;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full ${className || ''}`}>
      {/* Header mit Amtstitel */}
      <div className="flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-gray-700">
        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {office.name}
        </h3>
      </div>
      
      {/* Informationsbereich */}
      <div className="grid grid-cols-1 gap-3">
        {/* Abteilung (falls vorhanden) */}
        {office.department && (
          <InfoRow 
            icon={<Building className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Abteilung" 
            value={office.department} 
          />
        )}
        
        {/* Adresse */}
        {office.address && (
          <InfoRow 
            icon={<MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Standort" 
            value={office.address} 
          />
        )}
        
        {/* Öffnungszeiten */}
        {office.openingHours && (
          <InfoRow 
            icon={<Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Öffnungszeiten" 
            value={office.openingHours} 
          />
        )}
        
        {/* Telefonnummer */}
        {office.contact?.phone && (
          <InfoRow 
            icon={<Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Telefon" 
            value={office.contact.phone} 
            type="phone" 
          />
        )}
        
        {/* E-Mail */}
        {office.contact?.email && (
          <InfoRow 
            icon={<Mail className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="E-Mail" 
            value={office.contact.email} 
            type="email" 
          />
        )}
        
        {/* Website */}
        {office.contact?.website && (
          <InfoRow 
            icon={<Globe className="h-4 w-4 text-gray-500 dark:text-gray-400" />}
            label="Website" 
            value={office.contact.website} 
            type="website" 
          />
        )}
        
        {/* Services */}
        {office.services && office.services.length > 0 && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-start">
              <List className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dienstleistungen:</div>
                <ul className="text-sm text-gray-700 dark:text-gray-300 list-disc pl-5 space-y-1">
                  {office.services.map((service, index) => (
                    <li key={index}>{service}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
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