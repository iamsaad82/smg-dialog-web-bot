import React from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { DocumentsProvider } from '@/components/documents/context/DocumentsProvider';
import DocumentsView from '@/components/documents/DocumentsView';
import { AdminLayout } from '@/components/layouts/admin-layout';

/**
 * Seite für die Dokumentenverwaltung
 * Nutzt den DocumentsProvider für die Daten und Funktionen
 */
const DocumentsPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const tenantId = id as string;
  
  // Seite mit Layoutrahmen rendern
  return (
    <AdminLayout>
      <section className="container py-6 space-y-6">
        {tenantId ? (
          <DocumentsProvider tenantId={tenantId}>
            <DocumentsView />
          </DocumentsProvider>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold">Tenant-ID nicht gefunden</h2>
            <p className="text-muted-foreground mt-2">
              Bitte wählen Sie einen gültigen Tenant aus.
            </p>
          </div>
        )}
      </section>
    </AdminLayout>
  );
};

export default DocumentsPage; 