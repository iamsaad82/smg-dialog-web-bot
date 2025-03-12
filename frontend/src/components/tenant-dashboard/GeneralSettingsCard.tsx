import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface GeneralSettingsProps {
  name: string
  botName: string
  botWelcomeMessage: string
  logoUrl: string
  onChange: (name: string, value: string) => void
}

export function GeneralSettingsCard({
  name,
  botName,
  botWelcomeMessage,
  logoUrl,
  onChange,
}: GeneralSettingsProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Allgemeine Einstellungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name des Kunden</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="z.B. Musterfirma GmbH"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="botName">Name des Bots</Label>
          <Input
            id="botName"
            value={botName}
            onChange={(e) => onChange("bot_name", e.target.value)}
            placeholder="z.B. Support-Assistent"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="welcomeMessage">Willkommensnachricht</Label>
          <Input
            id="welcomeMessage"
            value={botWelcomeMessage}
            onChange={(e) => onChange("bot_welcome_message", e.target.value)}
            placeholder="z.B. Hallo! Wie kann ich Ihnen helfen?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            value={logoUrl}
            onChange={(e) => onChange("logo_url", e.target.value)}
            placeholder="https://..."
          />
        </div>
      </CardContent>
    </Card>
  )
} 