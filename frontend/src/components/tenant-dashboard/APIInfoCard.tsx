import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface APIInfoCardProps {
  apiKey: string
  tenantId: string
}

export function APIInfoCard({ apiKey, tenantId }: APIInfoCardProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>API-Informationen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="apiKey">API-Key</Label>
          <Input
            id="apiKey"
            value={apiKey}
            readOnly
            className="font-mono bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tenantId">Tenant ID</Label>
          <Input
            id="tenantId"
            value={tenantId}
            readOnly
            className="font-mono bg-muted"
          />
        </div>
      </CardContent>
    </Card>
  )
} 