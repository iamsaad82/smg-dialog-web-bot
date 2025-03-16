import { useState, useEffect } from 'react';
import { Tenant } from '@/types/api';
import { TenantApi } from '@/api/tenants';

// Initialisieren der API
const tenantApi = new TenantApi();

interface UseTenantResult {
  tenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook zum Abrufen und Verwalten von Tenant-Daten
 * 
 * @param tenantId ID des abzurufenden Tenants
 * @returns Tenant-Daten, Ladezustand und Fehler
 */
export function useTenant(tenantId?: string): UseTenantResult {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTenant = async () => {
    if (!tenantId) {
      setTenant(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await tenantApi.getTenant(tenantId);
      setTenant(data);
    } catch (err) {
      console.error('Fehler beim Laden des Tenants:', err);
      setError(err instanceof Error ? err : new Error('Fehler beim Laden des Tenants'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  return {
    tenant,
    isLoading,
    error,
    refetch: fetchTenant
  };
} 