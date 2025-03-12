import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tenant } from "@/types/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BotDemoOverview } from "../BotDemoOverview";
import { EmbedPreview } from '../EmbedPreview';

interface BotConfigTabProps {
  tenant: Tenant;
}

export function BotConfigTab({ tenant }: BotConfigTabProps) {
  return (
    <Card className="w-full mb-6">
      <CardHeader className="pb-3">
        <CardTitle>Bot-Konfiguration</CardTitle>
        <CardDescription>
          Hier sehen Sie die aktuelle Konfiguration Ihres Bots und Einbettungscode
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="embed">Einbetten</TabsTrigger>
            <TabsTrigger value="advanced">Erweitert</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <BotDemoOverview tenant={tenant} />
          </TabsContent>
          
          <TabsContent value="embed" className="space-y-4">
            <EmbedPreview tenant={tenant} />
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">KI-Modell</h3>
                  <p className="text-sm text-gray-500">
                    {tenant.use_mistral ? "Mistral" : "OpenAI GPT"} 
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Benutzerdefinierte Anweisungen</h3>
                  <p className="text-sm text-gray-500">
                    {tenant.custom_instructions ? 
                      (tenant.custom_instructions.length > 100 ? 
                        `${tenant.custom_instructions.substring(0, 100)}...` : 
                        tenant.custom_instructions) : 
                      "Keine benutzerdefinierten Anweisungen"}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">API-Informationen</h3>
                <p className="text-sm text-gray-500">
                  Status: {tenant.api_key ? "API-Schlüssel konfiguriert" : "Kein API-Schlüssel konfiguriert"}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 