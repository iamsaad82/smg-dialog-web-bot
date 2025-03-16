import React, { useState, useEffect } from "react"
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
  // Debug: Log tenant object with Types
  useEffect(() => {
    console.log("TenantSettingsForm - tenant received:", tenant);
  }, [tenant]);

  const [formData, setFormData] = useState({
    name: tenant.name || "",
    bot_name: tenant.bot_name || "",
    bot_welcome_message: tenant.bot_welcome_message || "",
    primary_color: tenant.primary_color || "#4f46e5",
    secondary_color: tenant.secondary_color || "#ffffff",
    logo_url: tenant.logo_url || "",
    use_mistral: tenant.use_mistral === true,
    custom_instructions: tenant.custom_instructions || "",
    renderer_type: tenant.renderer_type || "default",
    config: tenant.config || {},
  })

  // Update formData when tenant changes
  useEffect(() => {
    console.log("TenantSettingsForm - tenant changed, updating formData");
    
    setFormData({
      name: tenant.name || "",
      bot_name: tenant.bot_name || "",
      bot_welcome_message: tenant.bot_welcome_message || "",
      primary_color: tenant.primary_color || "#4f46e5",
      secondary_color: tenant.secondary_color || "#ffffff",
      logo_url: tenant.logo_url || "",
      use_mistral: tenant.use_mistral === true,
      custom_instructions: tenant.custom_instructions || "",
      renderer_type: tenant.renderer_type || "default",
      config: tenant.config || {},
    });
  }, [tenant]);

  // Debug: Log formData state
  useEffect(() => {
    console.log("TenantSettingsForm - formData:", formData);
  }, [formData]);

  const handleChange = (name: string, value: string | boolean | object) => {
    console.log(`TenantSettingsForm - handleChange: ${name} = ${value} (type: ${typeof value})`);
    
    // Ensure boolean values are treated as boolean
    if (name === "use_mistral") {
      const boolValue = value === true;
      console.log(`Converting ${name} to strict boolean: ${boolValue}`);
      setFormData((prev) => ({
        ...prev,
        [name]: boolValue
      }));
    } else if (name === "config") {
      // Behandle config als Objekt
      setFormData((prev) => ({
        ...prev,
        config: value as object
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Ensure boolean values are properly set with explicit conversion
    const dataToSubmit = {
      ...formData,
      use_mistral: formData.use_mistral === true
    };
    
    console.log("TenantSettingsForm - handleSubmit - sending data:", dataToSubmit);
    await onSave(dataToSubmit)
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
            rendererType={formData.renderer_type}
            config={formData.config}
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