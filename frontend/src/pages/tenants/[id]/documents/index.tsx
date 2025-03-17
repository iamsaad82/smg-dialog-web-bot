import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { DocumentsProvider } from '@/components/documents/context/DocumentsProvider';
import DocumentsView from '@/components/documents/DocumentsView';
import { AdminLayout } from '@/components/layouts/admin-layout';
import { Loader2 } from 'lucide-react';

/**
 * Seite für die Dokumentenverwaltung
 * Nutzt den DocumentsProvider für die Daten und Funktionen
 */
const DocumentsPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const tenantId = id as string;
  
  // Client-only flag um sicherzustellen, dass API-Aufrufe nur im Browser stattfinden
  const [isClient, setIsClient] = useState(false);
  
  // Beim ersten Render prüfen, ob wir im Browser sind
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Standard Breadcrumb für alle Varianten
  const breadcrumbItems = [
    { href: "/tenants", label: "Mandanten" },
    { href: `/tenants/${id}`, label: "Details" },
    { href: `/tenants/${id}/documents`, label: "Dokumente", isCurrent: true },
  ];
  
  // Während des serverseitigen Renderings eine einfache Ladeanzeige anzeigen
  if (!isClient) {
    return (
      <AdminLayout breadcrumbItems={breadcrumbItems}>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Anwendung wird geladen...</span>
        </div>
      </AdminLayout>
    );
  }
  
  // Seite mit Layoutrahmen rendern
  return (
    <AdminLayout breadcrumbItems={breadcrumbItems}>
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