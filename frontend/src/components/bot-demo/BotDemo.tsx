import React, { useState, useEffect } from 'react';
import { Tenant } from "@/types/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChatContainer } from './chat/ChatContainer';
import { BotConfigTab } from './config/BotConfigTab';
import { apiClient } from "@/utils/api";

interface BotDemoProps {
  tenant: Tenant;
}

export function BotDemo({ tenant }: BotDemoProps) {
  // Stellt sicher, dass der API-Key gesetzt ist
  useEffect(() => {
    if (tenant.api_key) {
      apiClient.setApiKey(tenant.api_key);
    }
  }, [tenant.api_key]);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full max-w-xs mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="chat" className="rounded-full">Chat</TabsTrigger>
          <TabsTrigger value="config" className="rounded-full">Konfiguration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4">
          <ChatContainer tenant={tenant} />
        </TabsContent>
        
        <TabsContent value="config" className="space-y-4">
          <BotConfigTab tenant={tenant} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 