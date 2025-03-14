import React from 'react';
import { TenantRendererConfig, TenantRendererProps } from '../types';
import { GenericRenderer } from '../GenericRenderer';
import { SchoolRenderer } from './renderers/SchoolRenderer';
import { OfficeRenderer } from './renderers/OfficeRenderer';
import { ServiceRenderer } from './renderers/ServiceRenderer';
import { LocalLawRenderer } from './renderers/LocalLawRenderer';
import { KindergartenRenderer } from './renderers/KindergartenRenderer';
import { WebpageRenderer } from './renderers/WebpageRenderer';
import { WasteManagementRenderer } from './renderers/WasteManagementRenderer';

// Tenant-Konfiguration für Brandenburg
export const brandenburgConfig: TenantRendererConfig = {
  id: 'brandenburg',
  name: 'Stadt Brandenburg an der Havel',
  description: 'Renderer für Daten der Stadt Brandenburg (XML-basiert)',
  contentTypes: ['school', 'office', 'event', 'service', 'local_law', 'kindergarten', 'webpage', 'waste_management'],
  defaultRenderer: GenericRenderer,
  supportsCustomization: true
};

/**
 * Gibt den passenden Renderer für einen Content-Typ zurück
 */
export const getRendererForType = (
  contentType: string
): React.ComponentType<TenantRendererProps> => {
  // Renderer für verschiedene Content-Typen
  switch (contentType) {
    case 'school':
      return SchoolRenderer;
    case 'office':
      return OfficeRenderer;
    case 'service':
      return ServiceRenderer;
    case 'local_law':
      return LocalLawRenderer;
    case 'kindergarten':
      return KindergartenRenderer;
    case 'webpage':
      return WebpageRenderer;
    case 'waste_management':
      return WasteManagementRenderer;
    default:
      return GenericRenderer;
  }
}; 