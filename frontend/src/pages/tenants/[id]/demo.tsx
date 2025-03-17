import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import dynamic from 'next/dynamic'

import { AdminLayout } from "@/components/layouts/admin-layout"
import { Tenant } from "@/types/api"
import api from "@/api"

// BotDemo-Komponente mit NoSSR laden, da sie nur clientseitig funktioniert
const BotDemo = dynamic(
  () => import('@/components/bot-demo/BotDemo').then(mod => mod.BotDemo),
  { ssr: false }
)

export default function BotDemoPage() {
  const router = useRouter()
  const { id } = router.query
  
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Client-only flag um sicherzustellen, dass API-Aufrufe nur im Browser stattfinden
  const [isClient, setIsClient] = useState(false)
  
  // Beim ersten Render prüfen, ob wir im Browser sind
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Nur im Browser und wenn eine ID vorhanden ist, den Tenant laden
    if (!isClient || !id) return;

    const loadTenant = async () => {
      try {
        setLoading(true)
        console.log(`Lade Tenant mit ID ${id} (clientseitig)`)
        
        // Direkt versuchen, den spezifischen Tenant zu laden
        try {
          // Fallback: Falls ID vorhanden, direkter Versuch den Tenant zu laden
          const tenantData = await api.getTenant(id as string)
          if (tenantData) {
            console.log("Tenant direkt geladen:", tenantData)
            api.setApiKey(tenantData.api_key)
            setTenant(tenantData)
            setError(null)
            return
          }
        } catch (directErr) {
          console.log("Direkter Tenant-Abruf fehlgeschlagen, versuche alle Tenants zu laden:", directErr)
        }
        
        // Fallback: Alle Tenants laden und filtern
        const allTenants = await api.getAllTenants()
        console.log("Alle Tenants geladen:", allTenants)
        
        const currentTenant = allTenants.find(t => t.id === id)
        
        if (currentTenant) {
          api.setApiKey(currentTenant.api_key)
          // Detaillierte Tenant-Daten laden, falls erforderlich
          const tenantData = await api.getTenant(id as string)
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

    loadTenant()
  }, [id, isClient]) // isClient als Abhängigkeit hinzufügen

  // Standard Breadcrumb für alle Varianten
  const breadcrumbItems = [
    { href: "/tenants", label: "Mandanten" },
    { href: `/tenants/${id}`, label: "Details" },
    { href: `/tenants/${id}/demo`, label: "Bot-Demo", isCurrent: true },
  ];

  // Während des serverseitigen Renderings eine einfache Ladeanzeige anzeigen
  if (!isClient) {
    return (
      <AdminLayout breadcrumbItems={breadcrumbItems}>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="ml-2">Anwendung wird geladen...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout breadcrumbItems={breadcrumbItems}>
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