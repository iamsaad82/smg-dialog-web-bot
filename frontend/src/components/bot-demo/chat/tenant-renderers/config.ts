import { TenantRendererConfig } from './types';
import { GenericRenderer } from './GenericRenderer';

// Tenant-Konfigurationen
// Diese werden später dynamisch aus der Backend-Konfiguration geladen
export const availableTenantRenderers: TenantRendererConfig[] = [
  {
    id: 'brandenburg',
    name: 'Stadt Brandenburg an der Havel',
    description: 'Renderer für Daten der Stadt Brandenburg (XML-basiert)',
    contentTypes: ['school', 'office', 'event'],
    defaultRenderer: GenericRenderer,
    supportsCustomization: true
  },
  {
    id: 'generic',
    name: 'Generischer Renderer',
    description: 'Standard-Renderer für unbekannte Tenants',
    contentTypes: ['text', 'generic'],
    defaultRenderer: GenericRenderer,
    supportsCustomization: false
  }
];

/**
 * Hilfsfunktion für lokales Testen, die den devTenantId aus dem localStorage verwendet
 */
export const isDevMode = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Gibt die Tenant-ID für das aktuelle Environment zurück
 */
export const getDefaultTenantId = (): string => {
  // In der Entwicklungsumgebung können wir einen Tenant zum Testen erzwingen
  if (isDevMode() && typeof localStorage !== 'undefined') {
    const devTenantId = localStorage.getItem('devTenantId');
    if (devTenantId) return devTenantId;
  }
  
  // Standard-Tenant
  return 'brandenburg';
};

/**
 * Gibt die Konfiguration für einen Tenant zurück
 */
export const getTenantRendererConfig = (tenantId: string): TenantRendererConfig => {
  // Suche nach der passenden Konfiguration
  const config = availableTenantRenderers.find(config => config.id === tenantId);
  
  // Fallback auf generischen Renderer, wenn keine Konfiguration gefunden wurde
  return config || availableTenantRenderers.find(config => config.id === 'generic')!;
}; 