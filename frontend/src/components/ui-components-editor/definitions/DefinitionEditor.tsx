import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { HelpText } from '../shared/SectionHeading';
import { ComponentDefinition } from '../shared/types';

interface DefinitionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (definition: Omit<ComponentDefinition, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  definition: ComponentDefinition | null;
  isSaving: boolean;
}

/**
 * Dialog zur Bearbeitung oder Erstellung einer UI-Komponenten-Definition
 */
export const DefinitionEditor: React.FC<DefinitionEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  definition,
  isSaving
}) => {
  // Zustand für die Formulardaten
  const [name, setName] = useState(definition?.name || '');
  const [description, setDescription] = useState(definition?.description || '');
  const [exampleFormat, setExampleFormat] = useState(definition?.example_format || '');
  
  // Zurücksetzen der Formularfelder, wenn sich Definition ändert
  React.useEffect(() => {
    if (isOpen) {
      setName(definition?.name || '');
      setDescription(definition?.description || '');
      setExampleFormat(definition?.example_format || '');
    }
  }, [definition, isOpen]);
  
  // Speichern-Funktion
  const handleSave = async () => {
    if (!name.trim()) return;
    
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      example_format: exampleFormat.trim()
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {definition ? 'Komponente bearbeiten' : 'Neue Komponente erstellen'}
          </DialogTitle>
          <DialogDescription>
            Definieren Sie eine UI-Komponente, die der Bot in seinen Antworten verwenden kann
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Name der Komponente */}
          <div className="space-y-2">
            <Label htmlFor="component-name">Komponenten-Name</Label>
            <HelpText>
              Der Name sollte präzise und ohne Leerzeichen sein, z.B. "OpeningHoursTable"
            </HelpText>
            <Input
              id="component-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. OpeningHoursTable"
            />
          </div>
          
          {/* Beschreibung */}
          <div className="space-y-2">
            <Label htmlFor="component-description">Beschreibung</Label>
            <HelpText>
              Beschreiben Sie kurz, wofür diese Komponente gedacht ist
            </HelpText>
            <Textarea
              id="component-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="z.B. Zeigt strukturierte Öffnungszeiten an"
            />
          </div>
          
          {/* Beispiel-Format */}
          <div className="space-y-2">
            <Label htmlFor="example-format">Beispiel-Format (JSON)</Label>
            <HelpText>
              Geben Sie ein Beispiel für das JSON-Format an, das der Bot für diese Komponente generieren soll
            </HelpText>
            <Textarea
              id="example-format"
              value={exampleFormat}
              onChange={(e) => setExampleFormat(e.target.value)}
              placeholder='{"text": "Hier sind unsere Öffnungszeiten", "component": "OpeningHoursTable", "data": {...}}'
              className="font-mono h-40 text-sm"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !name.trim() || !exampleFormat.trim()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              'Speichern'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 