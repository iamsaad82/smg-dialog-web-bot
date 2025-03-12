import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocuments } from '../../context/DocumentsProvider';
import { Upload } from 'lucide-react';
import { toast } from '@/utils/toast';

/**
 * Komponente für das Hochladen von Markdown-Dokumenten
 */
export default function MarkdownDocumentUpload() {
  const { bulkUpload, closeUploadModal, isUploading } = useDocuments();
  
  // Formularfelder
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState('');
  
  // Datei-Input-Referenz
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Datei auswählen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Überprüfen, ob es sich um eine Markdown-Datei handelt
      if (!selectedFile.name.toLowerCase().endsWith('.md') && 
          !selectedFile.name.toLowerCase().endsWith('.markdown')) {
        toast.error('Ungültiges Dateiformat', {
          description: 'Bitte wählen Sie eine Markdown-Datei (.md oder .markdown) aus.'
        });
        setFile(null);
        
        // Datei-Input zurücksetzen
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };
  
  // Markdown-Datei hochladen
  const handleUpload = async () => {
    if (!file) {
      toast.error('Keine Datei ausgewählt', {
        description: 'Bitte wählen Sie eine Markdown-Datei aus.'
      });
      return;
    }
    
    try {
      // Optionen für den Markdown-Upload
      const options = {
        source: source || undefined
      };
      
      // Datei hochladen
      await bulkUpload(file, 'markdown', options);
      
      // Formular zurücksetzen und Modal schließen
      setFile(null);
      setSource('');
      
      // Datei-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      closeUploadModal();
    } catch (error) {
      console.error('Fehler beim Hochladen der Markdown-Datei:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Markdown-Datei-Upload */}
      <div className="space-y-2">
        <Label htmlFor="markdown-file">
          Markdown-Datei <span className="text-destructive">*</span>
        </Label>
        <Input
          id="markdown-file"
          type="file"
          accept=".md,.markdown"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
        <p className="text-sm text-muted-foreground">
          Wählen Sie eine Markdown-Datei (.md oder .markdown) aus. Die Datei wird als einzelnes Dokument hochgeladen.
        </p>
      </div>
      
      {/* Quellen-Eingabefeld */}
      <div className="space-y-2">
        <Label htmlFor="source">Quelle (optional)</Label>
        <Input
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Optionale Quellenangabe für das Dokument"
          disabled={isUploading}
        />
      </div>
      
      {/* Markdown-Hinweise */}
      <div className="rounded-md bg-muted p-3">
        <h3 className="text-sm font-medium mb-2">Hinweise zu Markdown</h3>
        <ul className="text-xs space-y-1 list-disc pl-4">
          <li>Jede Markdown-Datei wird als einzelnes Dokument hochgeladen.</li>
          <li>Die erste Überschrift (# Titel) wird als Dokumenttitel verwendet, falls vorhanden.</li>
          <li>Wenn keine Überschrift vorhanden ist, wird der Dateiname als Titel verwendet.</li>
          <li>Bilder und andere eingebettete Medien werden nicht importiert.</li>
        </ul>
      </div>
      
      {/* Aktionsschaltflächen */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          variant="outline"
          onClick={closeUploadModal}
          disabled={isUploading}
        >
          Abbrechen
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>Wird hochgeladen...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Markdown hochladen</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 