import React from 'react';
import { TenantRendererConfig, TenantRendererProps } from '../types';
import { GenericRenderer } from '../GenericRenderer';
import { SchoolRenderer } from './renderers/SchoolRenderer';

// Tenant-Konfiguration für Brandenburg
export const brandenburgConfig: TenantRendererConfig = {
  id: 'brandenburg',
  name: 'Stadt Brandenburg an der Havel',
  description: 'Renderer für Daten der Stadt Brandenburg (XML-basiert)',
  contentTypes: ['school', 'office', 'event'],
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
    default:
      return GenericRenderer;
  }
}; 