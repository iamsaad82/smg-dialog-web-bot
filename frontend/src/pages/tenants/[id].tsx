import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import api from '@/api';
import { Tenant } from '@/types/api';
import Link from 'next/link';
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";
import { toast } from "@/utils/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Layers } from "lucide-react";

export default function TenantDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadTenant = async () => {
      try {
        setLoading(true);
        
        // Zuerst alle Tenants laden, um den API-Key des aktuellen Tenants zu bekommen
        const allTenants = await api.getAllTenants();
        const currentTenant = allTenants.find(t => t.id === id);
        
        if (currentTenant) {
          // Den API-Key des aktuellen Tenants setzen
          api.setApiKey(currentTenant.api_key);
          
          // Dann die Tenant-Details laden
          const tenantData = await api.getTenant(id);
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

    loadTenant();
  }, [id]);

  const handleBack = () => {
    router.push('/');
  };

  const handleManageDocuments = () => {
    router.push(`/tenants/${id}/documents`);
  };

  const handleTestBot = () => {
    router.push(`/tenants/${id}/demo`);
  };

  const handleDeleteTenant = async () => {
    if (!id || typeof id !== 'string') return;
    
    // Dialog öffnen statt window.confirm verwenden
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      await api.deleteTenant(id);
      toast.success("Kunde erfolgreich gelöscht");
      router.push('/');
    } catch (error) {
      console.error('Fehler beim Löschen des Kunden:', error);
      toast.error("Fehler beim Löschen des Kunden", {
        description: "Bitte versuchen Sie es später erneut."
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{tenant ? `${tenant.name} - Details` : 'Tenant Details'}</title>
        <meta name="description" content="Kunde - Detailansicht" />
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          ) : tenant ? (
            <div className="space-y-6">
              {/* Tenant-Informationen */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Allgemeine Informationen</h3>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          ID: <span className="font-medium text-gray-900 dark:text-white">{tenant.id}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Name: <span className="font-medium text-gray-900 dark:text-white">{tenant.name}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Beschreibung: <span className="font-medium text-gray-900 dark:text-white">{tenant.description || 'Keine Beschreibung'}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Kontakt-E-Mail: <span className="font-medium text-gray-900 dark:text-white">{tenant.contact_email || 'Keine E-Mail'}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Erstellt am: <span className="font-medium text-gray-900 dark:text-white">{new Date(tenant.created_at).toLocaleDateString()}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Aktualisiert am: <span className="font-medium text-gray-900 dark:text-white">{new Date(tenant.updated_at).toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Bot-Konfiguration</h3>
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Bot-Name: <span className="font-medium text-gray-900 dark:text-white">{tenant.bot_name}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Willkommensnachricht: <span className="font-medium text-gray-900 dark:text-white">{tenant.bot_welcome_message}</span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Primärfarbe: <span className="font-medium text-gray-900 dark:text-white flex items-center">
                            {tenant.primary_color} 
                            <span className="ml-2 w-4 h-4 rounded-full" style={{ backgroundColor: tenant.primary_color }}></span>
                          </span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Sekundärfarbe: <span className="font-medium text-gray-900 dark:text-white flex items-center">
                            {tenant.secondary_color}
                            <span className="ml-2 w-4 h-4 rounded-full" style={{ backgroundColor: tenant.secondary_color }}></span>
                          </span>
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Modell: <span className="font-medium text-gray-900 dark:text-white">{tenant.use_mistral ? 'Mistral' : 'OpenAI'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* API-Schlüssel */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">API-Schlüssel</h3>
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Verwenden Sie diesen API-Schlüssel, um den Bot in Ihre Anwendung einzubetten.
                    </p>
                    <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                      <code className="text-sm font-mono">{tenant.api_key}</code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Einbettungscode */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Einbettungscode</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Klassisches Widget</h4>
                      <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
                        <code className="text-sm font-mono">{`<!-- SMG Dialog Chat Widget - Klassischer Modus -->
<script 
  src="${window.location.hostname.includes('localhost') ? 'http://localhost:3000' : 'https://dialog-engine-frontend.onrender.com'}/embed.js" 
  data-api-key="${tenant.api_key}" 
  data-mode="classic"
  data-primary-color="#4f46e5"
  data-secondary-color="#ffffff">
</script>`}</code>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Inline-Widget</h4>
                      <div className="mt-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-md overflow-x-auto">
                        <code className="text-sm font-mono">{`<!-- SMG Dialog Chat Widget - Inline-Modus -->
<script 
  src="${window.location.hostname.includes('localhost') ? 'http://localhost:3000' : 'https://dialog-engine-frontend.onrender.com'}/embed.js" 
  data-api-key="${tenant.api_key}" 
  data-mode="inline" 
  data-container-id="chat-container"
  data-primary-color="#4f46e5"
  data-secondary-color="#ffffff">
</script>
<div id="chat-container"></div>`}</code>
                      </div>
                    </div>
                    <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                      <p className="mb-2">Zusätzliche Parameter:</p>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><code>data-bot-name</code>: Benutzerdefinierter Name des Bots</li>
                        <li><code>data-primary-color</code>: Primärfarbe als HEX-Code (z.B. #4f46e5)</li>
                        <li><code>data-secondary-color</code>: Sekundärfarbe als HEX-Code (z.B. #ffffff)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Aktionen */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aktionen</h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      onClick={handleTestBot}
                      variant="default"
                    >
                      Bot testen
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/tenants/${id}/documents`}>
                        Dokumente verwalten
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`/tenants/${id}/interactive`}>
                        <Layers className="mr-2 h-4 w-4" />
                        UI-Komponenten
                      </Link>
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/tenants/${id}/edit`)}
                    >
                      Kunden bearbeiten
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={handleDeleteTenant}
                    >
                      Kunden löschen
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">Kunde nicht gefunden.</p>
              <Button
                onClick={handleBack}
                variant="default"
                className="mt-4"
              >
                Zurück zur Übersicht
              </Button>
            </div>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden. Der Kunde und alle zugehörigen Daten werden dauerhaft gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AdminLayout>
    </div>
  );
} 