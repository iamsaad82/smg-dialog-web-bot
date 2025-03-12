import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { apiClient } from '@/utils/api';
import { Tenant } from '@/types/api';

import { AdminLayout } from '@/components/layouts/admin-layout';
import { TenantDashboard } from '@/components/tenant-dashboard/TenantDashboard';
import { CustomerCostsCard } from '@/components/tenants/CustomerCostsCard';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Edit, FileText, MessageSquare, ArrowLeft } from 'lucide-react';

export default function TenantDashboardPage() {
  const router = useRouter();
  const { id } = router.query;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadData = async () => {
      try {
        setLoading(true);
        const allTenants = await apiClient.getAllTenants();
        const currentTenant = allTenants.find(t => t.id === id);
        
        if (currentTenant) {
          apiClient.setApiKey(currentTenant.api_key);
          const tenantData = await apiClient.getTenant(id);
          setTenant(tenantData);
          setError(null);
        } else {
          setError('Tenant nicht gefunden');
        }
      } catch (err) {
        console.error('Fehler beim Laden des Tenants:', err);
        setError('Fehler beim Laden der Kundendaten');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  return (
    <AdminLayout>
      {tenant ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <TenantDashboard
              tenant={tenant}
              isLoading={loading}
              error={error}
            />
          </Card>
          
          {tenant && (
            <CustomerCostsCard 
              customerId={tenant.id} 
              customerName={tenant.name} 
            />
          )}
        </div>
      ) : loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-lg border border-destructive p-4 text-destructive">
          <p>{error || 'Tenant nicht gefunden'}</p>
        </div>
      )}
    </AdminLayout>
  );
} 