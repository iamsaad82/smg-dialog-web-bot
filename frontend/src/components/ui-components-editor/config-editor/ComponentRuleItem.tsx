import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { PlusCircle, Trash2, ChevronDown, X } from "lucide-react";
import { HelpText } from '../shared/SectionHeading';
import { ComponentRule } from '../shared/types';
import { COMPONENT_EXAMPLES } from '../shared/constants';

interface ComponentRuleItemProps {
  rule: ComponentRule;
  onUpdate: (id: string, updates: Partial<ComponentRule>) => void;
  onDelete: (id: string) => void;
}

/**
 * Bearbeitbare Komponenten-Regel mit ein-/ausklappbarem Inhalt
 */
export const ComponentRuleItem: React.FC<ComponentRuleItemProps> = ({
  rule,
  onUpdate,
  onDelete
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Neues Trigger-Wort hinzufügen
  const addTrigger = () => {
    const newTriggers = [...rule.triggers, ''];
    onUpdate(rule.id, { triggers: newTriggers });
  };

  // Trigger-Wort aktualisieren
  const updateTrigger = (index: number, value: string) => {
    const newTriggers = [...rule.triggers];
    newTriggers[index] = value;
    onUpdate(rule.id, { triggers: newTriggers });
  };

  // Trigger-Wort entfernen
  const removeTrigger = (index: number) => {
    const newTriggers = [...rule.triggers];
    newTriggers.splice(index, 1);
    onUpdate(rule.id, { triggers: newTriggers });
  };

  return (
    <div className="border rounded-md p-2 mb-3 bg-card">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header der Regel */}
        <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-accent/50 rounded-sm">
          <div className="flex items-center gap-2">
            <Badge variant={rule.isEnabled ? "default" : "outline"}>
              {rule.isEnabled ? "Aktiv" : "Inaktiv"}
            </Badge>
            <span className="font-medium">{rule.component}</span>
            <span className="text-sm text-muted-foreground">
              ({rule.triggers.length} {rule.triggers.length === 1 ? 'Stichwort' : 'Stichwörter'})
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </CollapsibleTrigger>
        
        {/* Ausklappbarer Inhalt */}
        <CollapsibleContent className="p-3 pt-4 space-y-4">
          {/* Aktivierung der Regel */}
          <div className="flex items-center space-x-2">
            <Switch
              id={`rule-enabled-${rule.id}`}
              checked={rule.isEnabled}
              onCheckedChange={(checked) => onUpdate(rule.id, { isEnabled: checked })}
            />
            <Label htmlFor={`rule-enabled-${rule.id}`}>Regel aktivieren</Label>
          </div>
          
          {/* Komponenten-Auswahl */}
          <div>
            <Label htmlFor={`component-select-${rule.id}`}>UI-Komponente</Label>
            <HelpText>
              Wählen Sie, welche visuelle Komponente der Bot anzeigen soll
            </HelpText>
            
            <Select
              value={rule.component}
              onValueChange={(value) => onUpdate(rule.id, { component: value })}
            >
              <SelectTrigger id={`component-select-${rule.id}`}>
                <SelectValue placeholder="Komponente auswählen" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COMPONENT_EXAMPLES).map((componentName) => (
                  <SelectItem key={componentName} value={componentName}>
                    {componentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Komponenten-Beschreibung */}
            {rule.component && COMPONENT_EXAMPLES[rule.component as keyof typeof COMPONENT_EXAMPLES] && (
              <p className="text-sm text-muted-foreground mt-2">
                {COMPONENT_EXAMPLES[rule.component as keyof typeof COMPONENT_EXAMPLES].description}
              </p>
            )}
          </div>
          
          {/* Trigger-Wörter */}
          <div>
            <Label>Auslösende Stichwörter</Label>
            <HelpText>
              Definieren Sie Schlüsselwörter und Phrasen, bei denen diese Komponente verwendet werden soll
            </HelpText>
            
            {rule.triggers.map((trigger, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <Input
                  value={trigger}
                  onChange={(e) => updateTrigger(idx, e.target.value)}
                  placeholder="z.B. Öffnungszeiten, Wann habt ihr geöffnet"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTrigger(idx)}
                  disabled={rule.triggers.length <= 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              variant="outline"
              size="sm"
              onClick={addTrigger}
              className="mt-2"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Weiteres Stichwort
            </Button>
          </div>
          
          {/* Löschen-Button */}
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(rule.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Regel löschen
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}; 