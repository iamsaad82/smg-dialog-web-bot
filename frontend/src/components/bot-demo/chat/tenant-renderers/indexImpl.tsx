import React from 'react';
import { getTenantRendererConfig, getDefaultTenantId } from './config';
import type { StructuredData, TenantRendererProps } from './types';
import { GenericRenderer } from './GenericRenderer';

// Brandenburg-spezifische Importe
import { getRendererForType as getBrandenburgRenderer } from './brandenburg';

/**
 * Hook zur Ermittlung der aktuellen Tenant-ID
 */
export function useTenantId(): string {
  // In einer echten Anwendung würde die Tenant-ID aus dem Kontext kommen
  return getDefaultTenantId();
}

/**
 * Gibt den passenden Renderer für einen Tenant und Content-Typ zurück
 */
export function getRendererForTenant(
  tenantId: string,
  contentType: string
): React.ComponentType<TenantRendererProps> {
  switch (tenantId) {
    case 'brandenburg':
      return getBrandenburgRenderer(contentType);
    default:
      return GenericRenderer;
  }
}

/**
 * Wrapper-Komponente, die automatisch den richtigen Renderer auswählt
 */
export function TenantAwareRenderer(props: {
  data: StructuredData;
  tenantId?: string;
  className?: string;
}): JSX.Element {
  const { data, tenantId: explicitTenantId, className } = props;
  
  // Tenant-ID aus explizitem Parameter oder Fallback auf den Standard-Tenant
  const implicitTenantId = getDefaultTenantId();
  const effectiveTenantId = explicitTenantId || implicitTenantId;
  
  // Passenden Renderer ermitteln
  const RendererComponent = getRendererForTenant(effectiveTenantId, data.type);
  
  return <RendererComponent data={data} className={className} />;
} 