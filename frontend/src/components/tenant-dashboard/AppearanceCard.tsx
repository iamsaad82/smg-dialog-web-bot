import React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface AppearanceCardProps {
  primaryColor: string
  secondaryColor: string
  onChange: (name: string, value: string) => void
}

export function AppearanceCard({
  primaryColor,
  secondaryColor,
  onChange,
}: AppearanceCardProps) {
  return (
    <Card>
      <CardHeader className="border-b border-border">
        <CardTitle>Erscheinungsbild</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primärfarbe</Label>
          <div className="flex items-center gap-4">
            <Input
              id="primaryColor"
              type="color"
              className="h-10 w-20"
              value={primaryColor}
              onChange={(e) => onChange("primary_color", e.target.value)}
            />
            <Input
              value={primaryColor}
              readOnly
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
          <div className="flex items-center gap-4">
            <Input
              id="secondaryColor"
              type="color"
              className="h-10 w-20"
              value={secondaryColor}
              onChange={(e) => onChange("secondary_color", e.target.value)}
            />
            <Input
              value={secondaryColor}
              readOnly
              className="font-mono"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 