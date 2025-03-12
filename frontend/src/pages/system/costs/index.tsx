import React from 'react';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { CostsOverview } from '@/components/system/costs/CostsOverview';

export default function CostsPage() {
  return (
    <AdminLayout>
      <CostsOverview />
    </AdminLayout>
  );
} 