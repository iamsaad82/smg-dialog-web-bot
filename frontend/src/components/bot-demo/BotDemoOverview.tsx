import React from "react"
import { Tenant } from "@/types/api"

interface BotDemoOverviewProps {
  tenant: Tenant
}

export function BotDemoOverview({ tenant }: BotDemoOverviewProps) {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Bot-Name</dt>
          <dd className="text-base">{tenant.bot_name || "Bot"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Primärfarbe</dt>
          <dd className="flex items-center gap-2">
            <div
              className="h-4 w-4 rounded-full border"
              style={{ backgroundColor: tenant.primary_color || "#4f46e5" }}
            ></div>
            <span className="text-base font-mono">{tenant.primary_color || "#4f46e5"}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">Begrüßungsnachricht</dt>
          <dd className="text-base">{tenant.bot_welcome_message || "Hallo! Wie kann ich Ihnen helfen?"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-muted-foreground">KI-Modell</dt>
          <dd className="text-base">{tenant.use_mistral ? "Mistral" : "OpenAI"}</dd>
        </div>
      </dl>
    </div>
  )
} 