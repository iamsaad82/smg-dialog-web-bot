import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocuments } from '../../context/DocumentsProvider';
import { Upload } from 'lucide-react';
import { toast } from '@/utils/toast';

/**
 * Komponente für das Hochladen von JSON-Dokumenten
 */
export default function JsonDocumentUpload() {
  const { bulkUpload, closeUploadModal, isUploading } = useDocuments();
  
  // Formularfelder
  const [files, setFiles] = useState<File[]>([]);
  
  // Datei-Input-Referenz
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dateien auswählen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length > 0) {
      // Überprüfen, ob es sich um JSON-Dateien handelt
      const invalidFiles = selectedFiles.filter(file => !file.name.toLowerCase().endsWith('.json'));
      
      if (invalidFiles.length > 0) {
        toast.error('Ungültige Dateiformate', {
          description: `${invalidFiles.length} Datei(en) sind keine JSON-Dateien.`
        });
        
        // Nur gültige JSON-Dateien behalten
        const validFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.json'));
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
  
  // JSON-Dateien hochladen
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Keine Dateien ausgewählt', {
        description: 'Bitte wählen Sie mindestens eine JSON-Datei aus.'
      });
      return;
    }
    
    try {
      // Hochladen jeder Datei nacheinander
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (files.length > 1) {
          toast.info(`Datei ${i + 1} von ${files.length} wird hochgeladen`, {
            description: file.name
          });
        }
        
        // Datei hochladen
        await bulkUpload(file, 'json');
      }
      
      // Erfolgsmeldung anzeigen
      if (files.length > 1) {
        toast.success(`${files.length} JSON-Dateien wurden hochgeladen`, {
          description: 'Alle Dateien wurden erfolgreich importiert.'
        });
      }
      
      // Formular zurücksetzen und Modal schließen
      setFiles([]);
      
      // Datei-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      closeUploadModal();
    } catch (error) {
      console.error('Fehler beim Hochladen der JSON-Dateien:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* JSON-Datei-Upload */}
      <div className="space-y-2">
        <Label htmlFor="json-file">
          JSON-Datei(en) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="json-file"
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
          multiple
        />
        <p className="text-sm text-muted-foreground">
          Wählen Sie eine oder mehrere JSON-Dateien mit den Dokumentdaten aus. Jede Datei sollte ein Array von Objekten mit "title" und "content" Feldern enthalten.
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
      
      {/* JSON-Format-Erklärung */}
      <div className="rounded-md bg-muted p-3">
        <h3 className="text-sm font-medium mb-2">Erforderliches Format</h3>
        <pre className="text-xs overflow-auto">
{`[
  {
    "title": "Dokumenttitel 1",
    "content": "Dokumentinhalt 1",
    "source": "Quelle 1" // optional
  },
  {
    "title": "Dokumenttitel 2",
    "content": "Dokumentinhalt 2"
  }
]`}
        </pre>
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
              <span>{files.length > 1 ? `${files.length} JSON-Dateien hochladen` : "JSON hochladen"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 