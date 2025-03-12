import React, { useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/api';
import { TenantCreate } from '@/types/api';
import { toast } from '@/utils/toast';

import { AdminLayout } from '@/components/layouts/admin-layout';
import { TenantCreateForm } from '@/components/tenants/TenantCreateForm';

export default function CreateTenantPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateTenant = async (data: TenantCreate) => {
    try {
      setIsSubmitting(true);
      const newTenant = await api.createTenant(data);
      toast.success("Tenant erfolgreich erstellt");
      router.push(`/tenants/${newTenant.id}`);
    } catch (error) {
      console.error('Fehler beim Erstellen des Tenants:', error);
      toast.error("Fehler beim Erstellen des Tenants", {
        description: "Bitte versuchen Sie es erneut."
      });
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenant erstellen</h1>
          <p className="text-muted-foreground">
            Erstellen Sie einen neuen Tenant-Account im System
          </p>
        </div>

        <TenantCreateForm
          onSubmit={handleCreateTenant}
          isSubmitting={isSubmitting}
        />
      </div>
    </AdminLayout>
  );
} 