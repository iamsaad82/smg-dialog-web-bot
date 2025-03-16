import React, { useEffect } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AIModelCardProps {
  useMistral: boolean
  customInstructions: string
  rendererType: string
  config: {
    xml_url?: string
    [key: string]: any
  }
  onChange: (name: string, value: string | boolean | object) => void
}

export function AIModelCard({
  useMistral,
  customInstructions,
  rendererType = "default",
  config = {},
  onChange,
}: AIModelCardProps) {
  
  // Debug Logging
  useEffect(() => {
    console.log("AIModelCard - rendererType:", rendererType);
    console.log("AIModelCard - config:", config);
  }, [rendererType, config]);
  
  const handleConfigChange = (key: string, value: string) => {
    const newConfig = {
      ...config,
      [key]: value
    };
    onChange("config", newConfig);
  };
  
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
        
        <div className="space-y-2">
          <Label htmlFor="rendererType">Renderer-Typ</Label>
          <Select 
            value={rendererType} 
            onValueChange={(value) => onChange("renderer_type", value)}
          >
            <SelectTrigger id="rendererType">
              <SelectValue placeholder="Renderer-Typ auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Standard</SelectItem>
              <SelectItem value="xml">XML (Generisch)</SelectItem>
              <SelectItem value="stadt">Stadt/Kommune</SelectItem>
              <SelectItem value="custom">Benutzerdefiniert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {rendererType === "xml" && (
          <div className="space-y-2">
            <Label htmlFor="xmlUrl">XML-URL</Label>
            <Input
              id="xmlUrl"
              value={config.xml_url || ""}
              onChange={(e) => handleConfigChange("xml_url", e.target.value)}
              placeholder="https://beispiel.de/daten.xml"
            />
            <p className="text-sm text-muted-foreground">
              URL zur XML-Datei, die periodisch importiert werden soll.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="customInstructions">
            Benutzerdefinierte Anweisungen
          </Label>
          <Textarea
            id="customInstructions"
            value={customInstructions}
            onChange={(e) => onChange("custom_instructions", e.target.value)}
            placeholder="Geben Sie spezifische Anweisungen für den Bot ein..."
            className="min-h-[150px]"
          />
          <p className="text-sm text-muted-foreground">
            Diese Anweisungen werden an das KI-Modell gesendet, um sein Verhalten anzupassen.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 