import React, { useState, useEffect } from "react"
import api from "@/api"
import { Tenant } from "@/types/api"
import { toast } from "@/utils/toast"
import { GetServerSideProps } from "next"
import { serverSideApiCall } from "@/utils/serverSideApi"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { CustomersOverview } from "@/components/tenants/CustomersOverview"

// Server-Side-Props Funktion, um Tenants auf der Serverseite zu laden
export const getServerSideProps: GetServerSideProps = async () => {
  try {
    console.log("Server-Side: Lade Tenants");
    
    // Verwende die zentrale serverSideApiCall-Funktion
    const tenantsData = await serverSideApiCall<Tenant[]>('tenants', {
      headers: {
        'X-API-Key': 'admin-secret-key-12345'
      }
    });
    
    // Stelle sicher, dass alle Tenants die richtigen Felder haben
    const processedTenants = tenantsData.map(tenant => ({
      ...tenant,
      use_mistral: tenant.hasOwnProperty('use_mistral') ? tenant.use_mistral === true : false,
      renderer_type: tenant.renderer_type || 'default',
      config: tenant.config || {}
    }));

    return {
      props: {
        initialTenants: processedTenants,
      }
    };
  } catch (error) {
    console.error("Server-Side: Fehler beim Laden der Tenants:", error);
    return {
      props: {
        initialTenants: [],
        initialError: "Fehler beim serverseitigen Laden der Tenants"
      }
    };
  }
}

// Aktualisierte Props für die Seite
interface CustomersPageProps {
  initialTenants: Tenant[]
  initialError?: string
}

export default function CustomersPage({ initialTenants, initialError }: CustomersPageProps) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)

  // Client-seitige Aktualisierung nur bei Bedarf
  const refreshTenants = async () => {
    try {
      setLoading(true)
      
      // Verwende die API-Klasse, die jetzt die vereinheitlichte callApi-Funktion verwendet
      const tenants = await api.getAllTenants();
      setTenants(tenants);
      setError(null);
    } catch (err) {
      console.error("Fehler beim Aktualisieren der Tenants:", err)
      // Bestehende Tenants beibehalten, nur Fehlermeldung anzeigen
      toast.error("Fehler beim Aktualisieren", {
        description: "Die Daten könnten veraltet sein."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      // Verwende die API-Klasse, die jetzt die vereinheitlichte callApi-Funktion verwendet 
      await api.deleteTenant(tenant.id);
      setTenants((prev) => prev.filter((t) => t.id !== tenant.id))
      toast.success("Tenant erfolgreich gelöscht")
    } catch (error) {
      console.error("Fehler beim Löschen des Tenants:", error)
      toast.error("Fehler beim Löschen des Tenants", {
        description: "Bitte versuchen Sie es später erneut."
      })
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-destructive p-4 text-destructive">
          <p>{error}</p>
          <button
            onClick={refreshTenants}
            className="mt-4 rounded bg-primary px-4 py-2 text-white hover:bg-primary/90"
          >
            Erneut versuchen
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <CustomersOverview 
        tenants={tenants} 
        onDeleteTenant={handleDeleteTenant} 
      />
    </AdminLayout>
  )
} 