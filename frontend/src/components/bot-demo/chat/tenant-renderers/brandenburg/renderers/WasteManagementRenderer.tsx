import React from 'react';
import { TenantRendererProps } from '../../types';
import { BrandenburgWasteManagement } from '../types';
import { Trash2, Info } from 'lucide-react';

/**
 * Renderer für Entsorgungsinformationen aus Brandenburg
 */
export const WasteManagementRenderer: React.FC<TenantRendererProps> = ({ data, className }) => {
  // Cast zu spezifischem Typ
  const wasteManagement = data.data as BrandenburgWasteManagement;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 space-y-3 w-full ${className || ''}`}>
      {/* Header mit Entsorgungstitel */}
      <div className="flex items-center gap-2 border-b pb-2 border-gray-200 dark:border-gray-700">
        <Trash2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {wasteManagement.name}
        </h3>
      </div>
      
      {/* Beschreibung */}
      {wasteManagement.description && (
        <div className="mt-2">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-gray-500 dark:text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {wasteManagement.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 