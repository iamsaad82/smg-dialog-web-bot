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
  const [files, setFiles] = useState<File[]>([]);
  const [source, setSource] = useState('');
  
  // Datei-Input-Referenz
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dateien auswählen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length > 0) {
      // Überprüfen, ob es sich um Markdown-Dateien handelt
      const invalidFiles = selectedFiles.filter(file => 
        !file.name.toLowerCase().endsWith('.md') && 
        !file.name.toLowerCase().endsWith('.markdown')
      );
      
      if (invalidFiles.length > 0) {
        toast.error('Ungültige Dateiformate', {
          description: `${invalidFiles.length} Datei(en) sind keine Markdown-Dateien.`
        });
        
        // Nur gültige Markdown-Dateien behalten
        const validFiles = selectedFiles.filter(file => 
          file.name.toLowerCase().endsWith('.md') || 
          file.name.toLowerCase().endsWith('.markdown')
        );
        setFiles(validFiles);
        
        if (validFiles.length === 0) {
          // Datei-Input zurücksetzen, wenn keine gültigen Dateien
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
        return;
      }
      
      setFiles(selectedFiles);
    } else {
      setFiles([]);
    }
  };
  
  // Markdown-Dateien hochladen
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Keine Dateien ausgewählt', {
        description: 'Bitte wählen Sie mindestens eine Markdown-Datei aus.'
      });
      return;
    }
    
    try {
      // Optionen für den Markdown-Upload
      const options = {
        source: source || undefined
      };
      
      // Hochladen jeder Datei nacheinander
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (files.length > 1) {
          toast.info(`Datei ${i + 1} von ${files.length} wird hochgeladen`, {
            description: file.name
          });
        }
        
        // Datei hochladen
        await bulkUpload(file, 'markdown', options);
      }
      
      // Erfolgsmeldung anzeigen
      if (files.length > 1) {
        toast.success(`${files.length} Markdown-Dateien wurden hochgeladen`, {
          description: 'Alle Dateien wurden erfolgreich importiert.'
        });
      }
      
      // Formular zurücksetzen und Modal schließen
      setFiles([]);
      setSource('');
      
      // Datei-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      closeUploadModal();
    } catch (error) {
      console.error('Fehler beim Hochladen der Markdown-Dateien:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Markdown-Datei-Upload */}
      <div className="space-y-2">
        <Label htmlFor="markdown-file">
          Markdown-Datei(en) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="markdown-file"
          type="file"
          accept=".md,.markdown"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
          multiple
        />
        <p className="text-sm text-muted-foreground">
          Wählen Sie eine oder mehrere Markdown-Dateien (.md oder .markdown) aus. Jede Datei wird als einzelnes Dokument hochgeladen.
        </p>
        {files.length > 0 && (
          <div className="text-sm mt-2">
            <p className="font-medium">Ausgewählte Dateien ({files.length}):</p>
            <ul className="list-disc pl-5 mt-1">
              {files.slice(0, 5).map((file, index) => (
                <li key={index}>{file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
              ))}
              {files.length > 5 && <li>... und {files.length - 5} weitere</li>}
            </ul>
          </div>
        )}
      </div>
      
      {/* Quellen-Eingabefeld */}
      <div className="space-y-2">
        <Label htmlFor="source">Quelle (optional)</Label>
        <Input
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Optionale Quellenangabe für alle Dokumente"
          disabled={isUploading}
        />
        {files.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            Hinweis: Die hier angegebene Quelle wird für alle hochgeladenen Dokumente verwendet.
          </p>
        )}
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
          disabled={isUploading || files.length === 0}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>Wird hochgeladen...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>{files.length > 1 ? `${files.length} Markdown-Dateien hochladen` : "Markdown hochladen"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 