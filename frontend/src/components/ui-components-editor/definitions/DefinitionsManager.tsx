import React, { useState, useEffect } from 'react';
import { toast } from "sonner";
import { DefinitionList } from './DefinitionList';
import { DefinitionEditor } from './DefinitionEditor';
import { DeleteConfirmation } from './DeleteConfirmation';
import { ComponentDefinition } from '../shared/types';
import { uiComponentsApi } from '@/api/interactive';

interface DefinitionsManagerProps {
  isAdmin: boolean;
}

/**
 * Hauptkomponente zur Verwaltung der UI-Komponenten-Definitionen
 */
export const DefinitionsManager: React.FC<DefinitionsManagerProps> = ({
  isAdmin
}) => {
  // Zustand
  const [definitions, setDefinitions] = useState<ComponentDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog-Zustand
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDefinition, setSelectedDefinition] = useState<ComponentDefinition | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Definitionen beim ersten Laden abrufen
  useEffect(() => {
    fetchDefinitions();
  }, []);

  // Definitionen vom Backend abrufen
  const fetchDefinitions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await uiComponentsApi.getUIComponentDefinitions();
      setDefinitions(data);
    } catch (err: any) {
      console.error('Fehler beim Laden der Definitionen:', err);
      setError(err.message || 'Fehler beim Laden der Definitionen');
      
      toast.error("Fehler beim Laden", {
        description: "Die Komponenten-Definitionen konnten nicht geladen werden."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Dialog zum Bearbeiten öffnen
  const handleOpenEditor = (definition: ComponentDefinition | null = null) => {
    setSelectedDefinition(definition);
    setEditorOpen(true);
  };

  // Dialog zum Löschen öffnen
  const handleOpenDeleteDialog = (definition: ComponentDefinition) => {
    setSelectedDefinition(definition);
    setDeleteDialogOpen(true);
  };

  // Definition speichern (erstellen oder aktualisieren)
  const handleSaveDefinition = async (definitionData: Omit<ComponentDefinition, 'id' | 'created_at' | 'updated_at'>) => {
    setIsSaving(true);
    
    try {
      if (selectedDefinition) {
        // Bestehende Definition aktualisieren
        await uiComponentsApi.updateUIComponentDefinition(selectedDefinition.id, definitionData);
        
        toast.success("Definition aktualisiert", {
          description: `Die Komponente "${definitionData.name}" wurde erfolgreich aktualisiert.`
        });
      } else {
        // Neue Definition erstellen
        await uiComponentsApi.createUIComponentDefinition(definitionData);
        
        toast.success("Definition erstellt", {
          description: `Die Komponente "${definitionData.name}" wurde erfolgreich erstellt.`
        });
      }
      
      // Definitionen neu laden und Dialog schließen
      await fetchDefinitions();
      setEditorOpen(false);
    } catch (err: any) {
      toast.error("Fehler beim Speichern", {
        description: err.message || "Die Komponente konnte nicht gespeichert werden."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Definition löschen
  const handleDeleteDefinition = async () => {
    if (!selectedDefinition) return;
    
    setIsDeleting(true);
    
    try {
      await uiComponentsApi.deleteUIComponentDefinition(selectedDefinition.id);
      
      toast.success("Definition gelöscht", {
        description: `Die Komponente "${selectedDefinition.name}" wurde erfolgreich gelöscht.`
      });
      
      // Definitionen neu laden und Dialog schließen
      await fetchDefinitions();
      setDeleteDialogOpen(false);
    } catch (err: any) {
      toast.error("Fehler beim Löschen", {
        description: err.message || "Die Komponente konnte nicht gelöscht werden."
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Hauptliste der Definitionen */}
      <DefinitionList
        definitions={definitions}
        isAdmin={isAdmin}
        onEdit={handleOpenEditor}
        onDelete={handleOpenDeleteDialog}
        onAdd={() => handleOpenEditor(null)}
        isLoading={isLoading}
      />
      
      {/* Editor-Dialog */}
      <DefinitionEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveDefinition}
        definition={selectedDefinition}
        isSaving={isSaving}
      />
      
      {/* Lösch-Bestätigungsdialog */}
      <DeleteConfirmation
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteDefinition}
        definition={selectedDefinition}
        isDeleting={isDeleting}
      />
    </div>
  );
}; 