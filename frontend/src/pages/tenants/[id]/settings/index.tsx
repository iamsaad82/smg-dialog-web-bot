import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import api from "@/api"
import { Tenant, TenantUpdate } from "@/types/api"
import { toast } from "@/utils/toast"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { TenantSettingsForm } from "@/components/tenant-dashboard/TenantSettingsForm"

export default function TenantSettingsPage() {
  const router = useRouter()
  const { id } = router.query
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id || typeof id !== "string") return

    const loadData = async () => {
      try {
        setLoading(true)
        const allTenants = await api.getAllTenants()
        const currentTenant = allTenants.find(t => t.id === id)
        
        if (currentTenant) {
          api.setApiKey(currentTenant.api_key)
          const tenantData = await api.getTenant(id)
          console.log("TenantSettingsPage - Loaded tenant data:", tenantData);
          setTenant(tenantData)
          setError(null)
        } else {
          setError("Tenant nicht gefunden")
        }
      } catch (err) {
        console.error("Fehler beim Laden des Tenants:", err)
        setError("Fehler beim Laden der Kundendaten")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleSaveSettings = async (updatedData: Partial<Tenant>) => {
    if (!tenant) return

    try {
      setSaving(true)
      console.log("TenantSettingsPage - Received updated data:", JSON.stringify(updatedData));
      
      // Stellen Sie sicher, dass use_mistral ein boolescher Wert ist
      if (updatedData.hasOwnProperty('use_mistral')) {
        const boolValue = updatedData.use_mistral === true;
        console.log(`Converting use_mistral from ${updatedData.use_mistral} (${typeof updatedData.use_mistral}) to ${boolValue}`);
        updatedData.use_mistral = boolValue;
      }
      
      // Konvertiere null-Werte zu undefined für kompatibilität mit TenantUpdate
      const cleanedData: TenantUpdate = Object.entries(updatedData).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: value === null ? undefined : value
        }),
        {} as TenantUpdate
      )
      
      console.log("TenantSettingsPage - Sending cleaned data:", JSON.stringify(cleanedData));
      
      const savedTenant = await api.updateTenant(tenant.id, cleanedData);
      console.log("TenantSettingsPage - Response from API:", JSON.stringify(savedTenant));
      
      // Aktualisiere die vollständigen Daten vom Server nach dem Speichern
      const updatedTenant = await api.getTenant(tenant.id);
      console.log("TenantSettingsPage - Fetched updated tenant data:", updatedTenant);
      
      // Aktualisiere den lokalen Tenant-Zustand
      setTenant(updatedTenant);
      
      // Erfolgsmeldung mit Toast statt alert
      toast.success("Einstellungen wurden erfolgreich gespeichert")
    } catch (err) {
      console.error("Fehler beim Speichern:", err)
      toast.error("Fehler beim Speichern der Einstellungen", {
        description: "Bitte versuchen Sie es erneut."
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bot-Einstellungen</h1>
          <p className="text-muted-foreground">
            Konfigurieren Sie hier Ihren Bot und passen Sie sein Erscheinungsbild an.
          </p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive p-4 text-destructive">
            <p>{error}</p>
          </div>
        ) : tenant ? (
          <TenantSettingsForm
            tenant={tenant}
            onSave={handleSaveSettings}
            isSaving={saving}
          />
        ) : null}
      </div>
    </AdminLayout>
  )
} 