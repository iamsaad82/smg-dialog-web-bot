import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { BotDemo } from "@/components/bot-demo/BotDemo"
import { Tenant } from "@/types/api"
import { apiClient } from "@/utils/api"

export default function BotDemoPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTenant = async () => {
      try {
        setLoading(true)
        const allTenants = await apiClient.getAllTenants()
        const currentTenant = allTenants.find(t => t.id === id)
        
        if (currentTenant) {
          apiClient.setApiKey(currentTenant.api_key)
          const tenantData = await apiClient.getTenant(id as string)
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

    if (id) {
      loadTenant()
    }
  }, [id])

  return (
    <AdminLayout>
      {loading && (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="rounded-lg border border-destructive p-4 text-destructive">
          <p>{error}</p>
        </div>
      )}
      
      {tenant && <BotDemo tenant={tenant} />}
    </AdminLayout>
  )
} 