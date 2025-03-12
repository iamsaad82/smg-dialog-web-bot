import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface AIModelCardProps {
  useMistral: boolean
  customInstructions: string
  onChange: (name: string, value: string | boolean) => void
}

export function AIModelCard({
  useMistral,
  customInstructions,
  onChange,
}: AIModelCardProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>KI-Modell & Anweisungen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="useMistral" className="flex-1">
            Mistral AI verwenden
          </Label>
          <Switch
            id="useMistral"
            checked={useMistral}
            onCheckedChange={(checked) => onChange("use_mistral", checked)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customInstructions">Benutzerdefinierte Anweisungen</Label>
          <Textarea
            id="customInstructions"
            value={customInstructions}
            onChange={(e) => onChange("custom_instructions", e.target.value)}
            placeholder="Spezielle Anweisungen für den Bot..."
            className="min-h-[100px]"
          />
        </div>
      </CardContent>
    </Card>
  )
} 