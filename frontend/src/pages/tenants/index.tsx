import React, { useState, useEffect } from "react"
import api from "@/api"
import { Tenant } from "@/types/api"
import { toast } from "@/utils/toast"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { CustomersOverview } from "@/components/tenants/CustomersOverview"

export default function CustomersPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTenants = async () => {
      try {
        setLoading(true)
        const tenantsData = await api.getAllTenants()
        setTenants(tenantsData)
        setError(null)
      } catch (err) {
        console.error("Fehler beim Laden der Tenants:", err)
        setError("Fehler beim Laden der Tenants")
      } finally {
        setLoading(false)
      }
    }

    loadTenants()
  }, [])

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      await api.deleteTenant(tenant.id)
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
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <CustomersOverview tenants={tenants} onDeleteTenant={handleDeleteTenant} />
    </AdminLayout>
  )
} 