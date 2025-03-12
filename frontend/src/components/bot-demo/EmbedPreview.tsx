import React from "react"
import { Code, Copy, Check } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tenant } from "@/types/api"

interface EmbedPreviewProps {
  tenant: Tenant
}

export function EmbedPreview({ tenant }: EmbedPreviewProps) {
  const [copied, setCopied] = React.useState(false)

  const embedCode = `<!-- SMG Dialog Chat Bot Embed -->
<script 
  src="https://example.com/smg-dialog/embed.js"
  data-tenant-id="${tenant.id}"
  data-bot-name="${tenant.bot_name || 'Support Bot'}"
  data-primary-color="${tenant.primary_color || '#4f46e5'}"
  data-secondary-color="${tenant.secondary_color || '#ffffff'}"
  data-mode="classic" <!-- Optionen: classic, inline, fullscreen -->
  defer
></script>
<div id="smg-dialog-bot"></div>`

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Bot-Integration</CardTitle>
        <CardDescription>
          Integrieren Sie den Bot in Ihre Webseite
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="code" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="code">Code</TabsTrigger>
            <TabsTrigger value="preview">Vorschau</TabsTrigger>
          </TabsList>
          <TabsContent value="code" className="mt-4">
            <div className="relative">
              <pre className="rounded-md bg-muted p-4 overflow-x-auto font-mono text-sm">
                {embedCode}
              </pre>
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-2 right-2"
                onClick={handleCopyCode}
                title={copied ? "Kopiert" : "Kopieren"}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="preview" className="mt-4">
            <div className="rounded-md border p-4">
              <div className="flex flex-col space-y-4">
                <div className="text-center text-muted-foreground mb-2">
                  <p className="text-base font-medium">Vorschau der Einbettungsmodi</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Classic Mode Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50 relative h-[300px]">
                    <h3 className="text-sm font-medium mb-2">Classic Mode</h3>
                    <p className="text-xs text-muted-foreground mb-4">Schwebendes Chat-Icon in der unteren rechten Ecke</p>
                    
                    <div className="absolute bottom-4 right-4">
                      <div
                        className="flex items-center justify-center rounded-full w-12 h-12 shadow-md cursor-pointer"
                        style={{
                          backgroundColor: tenant.primary_color || "#4f46e5",
                          color: tenant.secondary_color || "#ffffff",
                        }}
                      >
                        <span className="text-xl">💬</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Inline Mode Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50 h-[300px] flex flex-col">
                    <h3 className="text-sm font-medium mb-2">Inline Mode</h3>
                    <p className="text-xs text-muted-foreground mb-4">Direkt in die Webseite eingebetteter Chat</p>
                    
                    <div className="flex-1 border rounded-md bg-white p-3 flex flex-col">
                      <div className="flex-1 overflow-hidden">
                        <div className="p-2 max-w-[80%] rounded-lg mb-2 text-xs"
                          style={{
                            backgroundColor: tenant.primary_color ? `${tenant.primary_color}20` : "#4f46e520",
                          }}
                        >
                          {tenant.bot_welcome_message || "Hallo! Wie kann ich Ihnen helfen?"}
                        </div>
                      </div>
                      
                      <div className="border-t pt-2">
                        <div className="bg-gray-100 rounded-full h-8 px-3 flex items-center text-xs text-gray-400">
                          Schreiben Sie eine Nachricht...
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fullscreen Mode Preview */}
                  <div className="border rounded-lg p-4 bg-gray-50 h-[300px] flex flex-col">
                    <h3 className="text-sm font-medium mb-2">Fullscreen Mode</h3>
                    <p className="text-xs text-muted-foreground mb-4">Vollbild-Chat für maximale Interaktion</p>
                    
                    <div className="flex-1 relative overflow-hidden">
                      <div className="absolute inset-0 flex flex-col">
                        <div className="h-8 w-full"
                          style={{
                            backgroundColor: tenant.primary_color || "#4f46e5",
                          }}
                        >
                          <div className="flex items-center h-full px-3">
                            <span className="text-xs font-medium" style={{ color: tenant.secondary_color || "#ffffff" }}>
                              {tenant.bot_name || "Support Bot"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 bg-white p-2 flex flex-col">
                          <div className="flex-1 overflow-hidden">
                            <div className="p-2 max-w-[80%] rounded-lg mb-2 text-xs"
                              style={{
                                backgroundColor: tenant.primary_color ? `${tenant.primary_color}20` : "#4f46e520",
                              }}
                            >
                              {tenant.bot_welcome_message || "Hallo! Wie kann ich Ihnen helfen?"}
                            </div>
                          </div>
                          
                          <div className="border-t pt-2">
                            <div className="bg-gray-100 rounded-full h-6 px-3 flex items-center text-xs text-gray-400">
                              Schreiben Sie eine Nachricht...
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        Sie können den Code einfach kopieren und in den &lt;body&gt;-Bereich Ihrer Webseite einfügen.
      </CardFooter>
    </Card>
  )
} 