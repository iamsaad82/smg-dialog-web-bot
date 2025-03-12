import React, { useState } from "react"
import { Tenant } from "@/types/api"

import { Button } from "@/components/ui/button"
import { GeneralSettingsCard } from "./GeneralSettingsCard"
import { AppearanceCard } from "./AppearanceCard"
import { AIModelCard } from "./AIModelCard"
import { APIInfoCard } from "./APIInfoCard"

interface TenantSettingsFormProps {
  tenant: Tenant
  onSave: (data: Partial<Tenant>) => Promise<void>
  isSaving: boolean
}

export function TenantSettingsForm({ tenant, onSave, isSaving }: TenantSettingsFormProps) {
  const [formData, setFormData] = useState({
    name: tenant.name || "",
    bot_name: tenant.bot_name || "",
    bot_welcome_message: tenant.bot_welcome_message || "",
    primary_color: tenant.primary_color || "#4f46e5",
    secondary_color: tenant.secondary_color || "#ffffff",
    logo_url: tenant.logo_url || "",
    use_mistral: tenant.use_mistral || false,
    custom_instructions: tenant.custom_instructions || ""
  })

  const handleChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          <GeneralSettingsCard
            name={formData.name}
            botName={formData.bot_name}
            botWelcomeMessage={formData.bot_welcome_message}
            logoUrl={formData.logo_url}
            onChange={handleChange}
          />

          <AppearanceCard
            primaryColor={formData.primary_color}
            secondaryColor={formData.secondary_color}
            onChange={handleChange}
          />

          <AIModelCard
            useMistral={formData.use_mistral}
            customInstructions={formData.custom_instructions}
            onChange={handleChange}
          />

          <APIInfoCard
            apiKey={tenant.api_key}
            tenantId={tenant.id}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Speichern..." : "Änderungen speichern"}
          </Button>
        </div>
      </div>
    </form>
  )
} 