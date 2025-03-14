import React, { useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface AIModelCardProps {
  useMistral: boolean
  customInstructions: string
  is_brandenburg?: boolean
  onChange: (name: string, value: string | boolean) => void
}

export function AIModelCard({
  useMistral,
  customInstructions,
  is_brandenburg = false,
  onChange,
}: AIModelCardProps) {
  
  // Debug Logging für is_brandenburg
  useEffect(() => {
    console.log("AIModelCard - is_brandenburg prop value:", is_brandenburg);
    console.log("AIModelCard - is_brandenburg type:", typeof is_brandenburg);
  }, [is_brandenburg]);
  
  // Stelle sicher, dass is_brandenburg ein Boolean ist
  const isBrandenburgBoolean = is_brandenburg === true;
  
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>KI-Modell & Integrationen</CardTitle>
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

        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="is_brandenburg" className="flex-1">
            Brandenburg-Integration aktivieren
            <span className="text-xs block text-gray-500 mt-1">
              Ermöglicht die Verarbeitung und Anzeige von strukturierten Daten aus Brandenburg.
            </span>
          </Label>
          <Switch
            id="is_brandenburg"
            checked={isBrandenburgBoolean}
            onCheckedChange={(checked) => {
              console.log("AIModelCard - Switch changed to:", checked, "(type:", typeof checked, ")");
              onChange("is_brandenburg", checked);
            }}
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