import React, { useState, useEffect } from 'react';
import { availableTenantRenderers } from './config';
import { StructuredData } from './types';

// Event für Test-Nachricht-Updates
export const TEST_MESSAGE_EVENT = 'dev-test-message-created';

/**
 * Hilfsfunktion zum Generieren von Test-Nachrichtendaten
 */
const generateTestMessage = (type: string) => {
  let data: any;
  
  switch (type) {
    case 'school':
      data = {
        name: "WIR-Grundschule",
        type: "Grundschule",
        management: "Frau Dietrich",
        address: "Maerckerstraße 11, 14776 Brandenburg an der Havel",
        contact: {
          phone: "(03381) 79 83 09 31",
          email: "grundschule@wir-ev-brb.de",
          website: "https://www.wir-ev-brb.de/Grundschule"
        },
        details: {
          allDayCare: true,
          additionalInfo: "Für weitere Informationen besuchen Sie bitte die Website der Schule."
        }
      };
      break;
    default:
      data = { test: "Keine Daten für diesen Typ verfügbar" };
  }
  
  return {
    id: `test-${Date.now()}`,
    role: "assistant",
    content: `Hier sind Informationen zu ${type === 'school' ? 'einer Schule' : 'einem Objekt'}.`,
    timestamp: new Date().toLocaleTimeString(),
    structured_data: [
      {
        type,
        data
      }
    ]
  };
};

/**
 * Entwicklungswerkzeuge für das lokale Testen der Tenant-Renderer
 * Diese Komponente wird nur im Entwicklungsmodus angezeigt
 */
export const DevTools: React.FC = () => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    localStorage.getItem('devTenantId') || 'brandenburg'
  );
  
  const [selectedDataType, setSelectedDataType] = useState<string>('school');
  
  // Bei Auswahl eines anderen Tenants den localStorage aktualisieren
  useEffect(() => {
    localStorage.setItem('devTenantId', selectedTenantId);
  }, [selectedTenantId]);
  
  // Im Produktionsmodus nicht anzeigen
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-md shadow-lg z-50 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold mb-2">Tenant-Renderer Tester</h3>
      
      <div className="space-y-2">
        <label className="block text-xs">Tenant für Tests:</label>
        <select
          className="w-full p-1 text-xs border rounded"
          value={selectedTenantId}
          onChange={(e) => setSelectedTenantId(e.target.value)}
        >
          {availableTenantRenderers.map(renderer => (
            <option key={renderer.id} value={renderer.id}>
              {renderer.name}
            </option>
          ))}
        </select>
        
        <label className="block text-xs mt-2">Datentyp:</label>
        <select
          className="w-full p-1 text-xs border rounded"
          value={selectedDataType}
          onChange={(e) => setSelectedDataType(e.target.value)}
        >
          <option value="school">Schule</option>
          <option value="office">Amt</option>
          <option value="event">Veranstaltung</option>
        </select>
        
        <div className="text-xs text-gray-500 mt-1">
          Aktiver Tenant: <strong>{selectedTenantId}</strong>
        </div>
        
        <div className="flex justify-between mt-2">
          <button
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={() => {
              // Test-Nachricht generieren und in localStorage speichern
              const testMessage = generateTestMessage(selectedDataType);
              localStorage.setItem('devTestMessage', JSON.stringify(testMessage));
              
              // Benutzerdefiniertes Event auslösen
              const event = new CustomEvent(TEST_MESSAGE_EVENT, { 
                detail: { message: testMessage }
              });
              window.dispatchEvent(event);
            }}
          >
            Test-Nachricht
          </button>
          
          <button
            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
            onClick={() => {
              localStorage.removeItem('devTenantId');
              localStorage.removeItem('devTestMessage');
              window.location.reload();
            }}
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}; 