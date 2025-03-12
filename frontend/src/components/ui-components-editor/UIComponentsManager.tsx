import React, { useState } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ConfigEditor } from './config-editor/ConfigEditor';
import { ChatPreview } from './preview/ChatPreview';
import { DefinitionsManager } from './definitions/DefinitionsManager';
import { UIComponentsConfig } from './shared/types';
import { DEFAULT_BASE_PROMPT, DEFAULT_RULES } from './shared/constants';

interface UIComponentsManagerProps {
  tenantId?: string;
  tenantName?: string;
  initialPrompt?: string;
  initialRules?: any[];
  onSave?: (prompt: string, rules: any[]) => Promise<boolean>;
}

/**
 * Haupt-Manager für die UI-Komponenten
 * Stellt Tabs für die verschiedenen Bereiche zur Verfügung
 */
const UIComponentsManager: React.FC<UIComponentsManagerProps> = ({
  tenantId,
  tenantName = 'Shopping Center',
  initialPrompt = DEFAULT_BASE_PROMPT,
  initialRules = DEFAULT_RULES,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState("config");
  const [currentConfig, setCurrentConfig] = useState<UIComponentsConfig>({
    prompt: initialPrompt,
    rules: initialRules
  });
  
  // Konfiguration speichern
  const handleSaveConfig = async (config: UIComponentsConfig) => {
    if (!onSave) return false;
    
    try {
      const success = await onSave(config.prompt, config.rules);
      
      if (success) {
        setCurrentConfig(config);
      }
      
      return success;
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
      return false;
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-6 space-y-8 max-w-7xl">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">UI-Komponenten für {tenantName}</h1>
        <p className="text-muted-foreground">
          Hier können Sie interaktive UI-Komponenten konfigurieren, die in den Bot-Antworten verwendet werden.
        </p>
      </div>
      
      <Alert>
        <AlertTitle>Info</AlertTitle>
        <AlertDescription className="mt-2">
          <ul className="list-disc pl-6 space-y-1">
            <li>UI-Komponenten machen Ihre Bot-Antworten ansprechender und interaktiver.</li>
            <li>Sie können bestimmen, bei welchen Anfragen der Bot welche Komponenten anzeigt.</li>
            <li>Eine Live-Vorschau hilft Ihnen, die Konfiguration zu testen.</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="config" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="max-w-md mx-auto grid grid-cols-3 mb-8">
          <TabsTrigger value="config">Konfiguration</TabsTrigger>
          <TabsTrigger value="preview">Live-Vorschau</TabsTrigger>
          <TabsTrigger value="definitions">Komponenten</TabsTrigger>
        </TabsList>
        
        <TabsContent value="config" className="space-y-6">
          <ConfigEditor
            initialConfig={currentConfig}
            onSave={handleSaveConfig}
          />
        </TabsContent>
        
        <TabsContent value="preview">
          <ChatPreview
            prompt={currentConfig.prompt}
          />
        </TabsContent>
        
        <TabsContent value="definitions">
          <DefinitionsManager
            isAdmin={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UIComponentsManager; 