import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { PlusCircle } from "lucide-react";
import { SectionHeading, HelpText } from '../shared/SectionHeading';
import { ComponentRule } from '../shared/types';
import { ComponentRuleItem } from './ComponentRuleItem';
import { generateId } from '../shared/utils';
import { COMPONENT_EXAMPLES } from '../shared/constants';

interface ComponentRulesEditorProps {
  rules: ComponentRule[];
  onChange: (rules: ComponentRule[]) => void;
}

/**
 * Editor für die Komponenten-Regeln
 */
export const ComponentRulesEditor: React.FC<ComponentRulesEditorProps> = ({
  rules,
  onChange
}) => {
  // Neue Regel hinzufügen
  const addRule = () => {
    const newRule: ComponentRule = {
      id: generateId(),
      component: 'OpeningHoursTable',
      triggers: ['Öffnungszeiten'],
      isEnabled: true
    };
    
    onChange([...rules, newRule]);
  };
  
  // Regel löschen
  const deleteRule = (id: string) => {
    onChange(rules.filter(rule => rule.id !== id));
  };
  
  // Regel aktualisieren
  const updateRule = (id: string, updates: Partial<ComponentRule>) => {
    onChange(rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Komponenten-Regeln</CardTitle>
        <CardDescription>
          Steuern Sie, wann der Bot welche interaktive Komponente verwenden soll
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeading 
          title="Regeln für interaktive Antworten"
          description="Der Bot verwendet diese Regeln, um zu entscheiden, wann er interaktive Komponenten anzeigt"
          rightElement={
            <Button
              onClick={addRule}
              size="sm"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Neue Regel
            </Button>
          }
        />
        
        <HelpText>
          Für jede Komponente können Sie mehrere Auslöser definieren. 
          Je genauer diese Auslöser sind, desto besser erkennt der Bot, wann er die Komponente einsetzen soll.
        </HelpText>
        
        {rules.length === 0 ? (
          <Alert className="my-4">
            <AlertTitle>Keine Regeln definiert</AlertTitle>
            <AlertDescription>
              Sie haben noch keine Komponenten-Regeln definiert. Klicken Sie auf "Neue Regel",
              um zu bestimmen, wann der Bot interaktive Komponenten verwenden soll.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2 mt-4">
            {rules.map((rule) => (
              <ComponentRuleItem
                key={rule.id}
                rule={rule}
                onUpdate={updateRule}
                onDelete={deleteRule}
              />
            ))}
          </div>
        )}
        
        {rules.length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={addRule}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Weitere Regel hinzufügen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 