import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { BasePromptEditor } from './BasePromptEditor';
import { ComponentRulesEditor } from './ComponentRulesEditor';
import { PromptPreview } from './PromptPreview';
import { ComponentRule, UIComponentsConfig } from '../shared/types';
import { generatePrompt } from '../shared/utils';

interface ConfigEditorProps {
  initialConfig: UIComponentsConfig;
  onSave: (config: UIComponentsConfig) => Promise<boolean>;
}

/**
 * Haupt-Editor für die UI-Komponenten-Konfiguration
 */
export const ConfigEditor: React.FC<ConfigEditorProps> = ({
  initialConfig,
  onSave
}) => {
  // Zustand
  const [basePrompt, setBasePrompt] = useState(initialConfig.prompt);
  const [rules, setRules] = useState<ComponentRule[]>(initialConfig.rules);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isChanged, setIsChanged] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("rules");
  
  // Wenn sich basePrompt oder rules ändern, generiere den vollständigen Prompt
  useEffect(() => {
    setGeneratedPrompt(generatePrompt(basePrompt, rules));
    
    // Überprüfen, ob sich etwas geändert hat
    const isPromptChanged = basePrompt !== initialConfig.prompt;
    
    const isRulesChanged = JSON.stringify(rules) !== JSON.stringify(initialConfig.rules);
    
    setIsChanged(isPromptChanged || isRulesChanged);
  }, [basePrompt, rules, initialConfig]);
  
  // Speichern der Konfiguration
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const success = await onSave({
        prompt: basePrompt,
        rules: rules
      });
      
      if (success) {
        setIsChanged(false);
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Konfiguration:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Zurücksetzen der Konfiguration auf den Ausgangszustand
  const handleReset = () => {
    setBasePrompt(initialConfig.prompt);
    setRules(initialConfig.rules);
  };
  
  return (
    <div className="space-y-6">
      {/* Tabs für die verschiedenen Bereiche */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="rules">Regeln definieren</TabsTrigger>
          <TabsTrigger value="prompt">Basis-Prompt</TabsTrigger>
          <TabsTrigger value="preview">Prompt-Vorschau</TabsTrigger>
        </TabsList>
        
        {/* Tab-Inhalte */}
        <TabsContent value="rules" className="space-y-6">
          <ComponentRulesEditor 
            rules={rules} 
            onChange={setRules} 
          />
        </TabsContent>
        
        <TabsContent value="prompt" className="space-y-6">
          <BasePromptEditor 
            value={basePrompt} 
            onChange={setBasePrompt} 
          />
        </TabsContent>
        
        <TabsContent value="preview" className="space-y-6">
          <PromptPreview 
            basePrompt={basePrompt} 
            rules={rules} 
          />
        </TabsContent>
      </Tabs>
      
      {/* Aktionsleiste mit Speichern/Zurücksetzen-Buttons */}
      <div className="flex justify-between border-t pt-4 mt-8">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!isChanged || isSaving}
        >
          Änderungen zurücksetzen
        </Button>
        
        <Button
          onClick={handleSave}
          disabled={!isChanged || isSaving}
        >
          {isSaving ? 'Wird gespeichert...' : 'Konfiguration speichern'}
        </Button>
      </div>
      
      {/* Info-Anzeige für ungespeicherte Änderungen */}
      {isChanged && (
        <div className="fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground py-2 px-4 rounded-md shadow-lg flex items-center">
          <span className="mr-2">Ungespeicherte Änderungen</span>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Wird gespeichert...' : 'Jetzt speichern'}
          </Button>
        </div>
      )}
    </div>
  );
}; 