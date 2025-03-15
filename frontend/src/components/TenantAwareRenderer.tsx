import React from 'react';
import { getRendererForTenant } from './bot-demo/chat/tenant-renderers';
import { GenericRenderer } from './bot-demo/chat/tenant-renderers/GenericRenderer';

interface TenantAwareRendererProps {
  data: any;
  tenantId?: string;
  contentType?: string;
  className?: string;
}

/**
 * Komponente, die als Brücke zwischen ChatMessage und den tenant-spezifischen Renderern dient.
 * Wählt den richtigen Renderer basierend auf tenantId und contentType.
 */
const TenantAwareRenderer: React.FC<TenantAwareRendererProps> = ({ 
  data, 
  tenantId, 
  contentType,
  className
}) => {
  // Wenn kein contentType angegeben ist, versuchen wir ihn aus den Daten zu ermitteln
  const effectiveContentType = contentType || (data?.type ? data.type : null);
  
  if (!effectiveContentType || !tenantId) {
    // Fallback auf generischen Renderer, wenn keine ausreichenden Informationen vorliegen
    return <GenericRenderer data={data} className={className} />;
  }

  try {
    // Den passenden Renderer für den Tenant und Content-Typ auswählen
    const Renderer = getRendererForTenant(tenantId, effectiveContentType);
    
    // Den ausgewählten Renderer mit den Daten rendern
    return <Renderer data={data.data || data} className={className} />;
  } catch (error) {
    console.error(`Fehler beim Rendern für Tenant ${tenantId}, Typ ${effectiveContentType}:`, error);
    
    // Fallback auf generischen Renderer im Fehlerfall
    // Wir casten das Objekt zu any, da der genaue Typ der StructuredData
    // je nach Tenant und Kontext unterschiedlich sein kann
    return (
      <GenericRenderer 
        data={
          {
            // Wir verwenden ein einfaches Format, das der GenericRenderer sicher anzeigen kann
            message: `Fehler beim Rendern (${effectiveContentType})`,
            data: data
          } as any
        } 
        className={className}
      />
    );
  }
};

export default TenantAwareRenderer; 