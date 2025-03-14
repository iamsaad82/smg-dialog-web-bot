import React from 'react';
import { getTenantRendererConfig, getDefaultTenantId } from './config';
import { StructuredData, TenantRendererProps } from './types';
import { GenericRenderer } from './GenericRenderer';

// Brandenburg-spezifische Importe
import { getRendererForType as getBrandenburgRenderer } from './brandenburg';

/**
 * Hook zur Ermittlung der aktuellen Tenant-ID
 */
export const useTenantId = (): string => {
  // In einer echten Anwendung würde die Tenant-ID aus dem Kontext kommen
  return getDefaultTenantId();
};

/**
 * Gibt den passenden Renderer für einen Tenant und Content-Typ zurück
 */
export const getRendererForTenant = (
  tenantId: string,
  contentType: string
): React.ComponentType<TenantRendererProps> => {
  switch (tenantId) {
    case 'brandenburg':
      return getBrandenburgRenderer(contentType);
    default:
      return GenericRenderer;
  }
};

/**
 * Wrapper-Komponente, die automatisch den richtigen Renderer auswählt
 */
export const TenantAwareRenderer: React.FC<{
  data: StructuredData;
  tenantId?: string;
  className?: string;
}> = ({ data, tenantId: explicitTenantId, className }) => {
  // Tenant-ID aus explizitem Parameter oder Fallback auf den Standard-Tenant
  const implicitTenantId = getDefaultTenantId();
  const effectiveTenantId = explicitTenantId || implicitTenantId;
  
  // Passenden Renderer ermitteln
  const Renderer = getRendererForTenant(effectiveTenantId, data.type);
  
  return <Renderer data={data} className={className} />;
};

// Re-exportiere wichtige Typen
export * from './types';
export * from './config'; 