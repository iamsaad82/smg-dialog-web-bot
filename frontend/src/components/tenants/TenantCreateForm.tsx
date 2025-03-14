import React, { useState } from "react"
import { TenantCreate } from "@/types/api"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface TenantCreateFormProps {
  onSubmit: (data: TenantCreate) => Promise<void>
  isSubmitting: boolean
}

export function TenantCreateForm({ onSubmit, isSubmitting }: TenantCreateFormProps) {
  const [formData, setFormData] = useState<TenantCreate>({
    name: "",
    description: "",
    contact_email: "",
    bot_name: "",
    bot_welcome_message: "Hallo! Wie kann ich Ihnen helfen?",
    primary_color: "#4f46e5",
    secondary_color: "#ffffff",
    use_mistral: false,
    custom_instructions: "",
    is_brandenburg: false,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Allgemeine Informationen</CardTitle>
          <CardDescription>
            Geben Sie die grundlegenden Informationen für den neuen Tenant ein.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="z.B. Acme GmbH"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Beschreiben Sie das Unternehmen kurz..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_email">Kontakt-E-Mail</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              value={formData.contact_email || ""}
              onChange={handleChange}
              placeholder="kontakt@beispiel.de"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bot-Konfiguration</CardTitle>
          <CardDescription>
            Konfigurieren Sie das Verhalten und Aussehen des Chatbots.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot_name">Bot-Name</Label>
            <Input
              id="bot_name"
              name="bot_name"
              value={formData.bot_name || ""}
              onChange={handleChange}
              placeholder="z.B. KI-Assistent"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot_welcome_message">Willkommensnachricht</Label>
            <Textarea
              id="bot_welcome_message"
              name="bot_welcome_message"
              value={formData.bot_welcome_message || ""}
              onChange={handleChange}
              placeholder="z.B. Hallo! Wie kann ich Ihnen helfen?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary_color">Primärfarbe</Label>
            <div className="flex items-center gap-4">
              <Input
                id="primary_color"
                name="primary_color"
                type="color"
                className="h-10 w-20"
                value={formData.primary_color || "#4f46e5"}
                onChange={handleChange}
              />
              <Input
                value={formData.primary_color || "#4f46e5"}
                readOnly
                className="font-mono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_color">Sekundärfarbe</Label>
            <div className="flex items-center gap-4">
              <Input
                id="secondary_color"
                name="secondary_color"
                type="color"
                className="h-10 w-20"
                value={formData.secondary_color || "#ffffff"}
                onChange={handleChange}
              />
              <Input
                value={formData.secondary_color || "#ffffff"}
                readOnly
                className="font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="use_mistral" className="flex-1">
              Mistral AI verwenden
            </Label>
            <Switch
              id="use_mistral"
              checked={formData.use_mistral || false}
              onCheckedChange={(checked) => handleSwitchChange("use_mistral", checked)}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="is_brandenburg" className="flex-1">
              Brandenburg-Integration aktivieren
              <span className="text-xs block text-gray-500 mt-1">
                Ermöglicht die Verarbeitung und Anzeige von strukturierten Daten aus Brandenburg.
              </span>
            </Label>
            <Switch
              id="is_brandenburg"
              checked={formData.is_brandenburg || false}
              onCheckedChange={(checked) => handleSwitchChange("is_brandenburg", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom_instructions">Benutzerdefinierte Anweisungen</Label>
            <Textarea
              id="custom_instructions"
              name="custom_instructions"
              value={formData.custom_instructions || ""}
              onChange={handleChange}
              placeholder="Spezielle Anweisungen für den Bot..."
              rows={3}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-4">
          <Button type="submit" disabled={isSubmitting || !formData.name}>
            {isSubmitting ? "Wird erstellt..." : "Tenant erstellen"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
} 