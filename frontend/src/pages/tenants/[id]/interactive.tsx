import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import { toast } from "sonner"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { UIComponentsManager } from "@/components/ui-components-editor"
import { uiComponentsApi } from "@/api/interactive"
import { apiClient } from "@/utils/api"
import { Tenant } from "@/types/api"

export default function UIComponentsPage() {
  const router = useRouter()
  const { id } = router.query
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [promptConfig, setPromptConfig] = useState({
    prompt: "Du bist ein hilfreicher Assistent für ein Shopping Center. Verwende spezielle UI-Komponenten, um Informationen ansprechend darzustellen.",
    rules: [
      { id: '1', component: 'OpeningHoursTable', triggers: ['Öffnungszeiten', 'Wann habt ihr geöffnet'], isEnabled: true },
      { id: '2', component: 'StoreMap', triggers: ['Wo finde ich', 'Welche Geschäfte'], isEnabled: true },
      { id: '3', component: 'ProductShowcase', triggers: ['Angebote', 'Produkte', 'Was gibt es Neues'], isEnabled: true },
      { id: '4', component: 'ContactCard', triggers: ['Kontakt', 'Ansprechpartner', 'Wen kann ich fragen'], isEnabled: true },
    ]
  })

  // Laden der Konfiguration, wenn ID verfügbar ist
  useEffect(() => {
    if (id && typeof id === 'string') {
      loadTenantAndConfig()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]) // loadTenantAndConfig wird absichtlich weggelassen, um Endless-Loop zu vermeiden

  const loadTenantAndConfig = async () => {
    if (!id || typeof id !== 'string') return
    
    setIsLoading(true)
    try {
      // Zuerst den Tenant laden, um den API-Schlüssel zu erhalten
      const allTenants = await apiClient.getAllTenants()
      const currentTenant = allTenants.find(t => t.id === id)
      
      if (currentTenant) {
        // API-Schlüssel setzen
        apiClient.setApiKey(currentTenant.api_key)
        // Auch für das UI-Components-API setzen (gleicher Core)
        setTenant(currentTenant)
        
        // Jetzt die UI-Komponenten-Konfiguration laden
        try {
          const data = await uiComponentsApi.getUIComponentsConfig(id)
          setPromptConfig(data)
        } catch (configError) {
          console.error("Fehler beim Laden der UI-Komponenten-Konfiguration:", configError)
          // Wenn keine Konfiguration gefunden wurde, verwenden wir die Standardwerte
        }
      } else {
        toast.error("Fehler", {
          description: "Tenant nicht gefunden"
        })
      }
    } catch (error) {
      console.error("Fehler beim Laden des Tenants:", error)
      toast.error("Fehler", {
        description: "Fehler beim Laden der Kundendaten"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Speichern der Konfiguration
  const handleSave = async (prompt: string, rules: any[]) => {
    if (!id || typeof id !== 'string') return false
    
    setIsLoading(true)
    try {
      await uiComponentsApi.saveUIComponentsConfig(id, { prompt, rules })
      
      toast.success("Erfolgreich gespeichert", {
        description: "Die UI-Komponenten-Konfiguration wurde erfolgreich gespeichert."
      })
      
      return true
    } catch (error) {
      console.error("Fehler beim Speichern der UI-Komponenten-Konfiguration:", error)
      
      toast.error("Fehler beim Speichern", {
        description: "Die Konfiguration konnte nicht gespeichert werden. Bitte versuchen Sie es erneut."
      })
      
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Breadcrumb-Items für die UI-Komponenten Seite
  const breadcrumbItems = [
    {
      label: "Tenants",
      href: "/tenants",
    },
    {
      label: "Tenant",
      href: `/tenants/${id}`,
    },
    {
      label: "UI-Komponenten",
      href: `/tenants/${id}/interactive`,
      isCurrent: true,
    },
  ]

  return (
    <AdminLayout breadcrumbItems={breadcrumbItems}>
      <UIComponentsManager 
        tenantId={id as string}
        tenantName="Shopping Center Demo"
        initialPrompt={promptConfig.prompt}
        initialRules={promptConfig.rules}
        onSave={handleSave}
      />
    </AdminLayout>
  )
} 