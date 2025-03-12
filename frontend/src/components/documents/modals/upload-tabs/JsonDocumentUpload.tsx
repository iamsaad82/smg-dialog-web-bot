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
  const [file, setFile] = useState<File | null>(null);
  
  // Datei-Input-Referenz
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Datei auswählen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Überprüfen, ob es sich um eine JSON-Datei handelt
      if (!selectedFile.name.toLowerCase().endsWith('.json')) {
        toast.error('Ungültiges Dateiformat', {
          description: 'Bitte wählen Sie eine JSON-Datei aus.'
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
  
  // JSON-Datei hochladen
  const handleUpload = async () => {
    if (!file) {
      toast.error('Keine Datei ausgewählt', {
        description: 'Bitte wählen Sie eine JSON-Datei aus.'
      });
      return;
    }
    
    try {
      // Datei hochladen
      await bulkUpload(file, 'json');
      
      // Formular zurücksetzen und Modal schließen
      setFile(null);
      
      // Datei-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      closeUploadModal();
    } catch (error) {
      console.error('Fehler beim Hochladen der JSON-Datei:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* JSON-Datei-Upload */}
      <div className="space-y-2">
        <Label htmlFor="json-file">
          JSON-Datei <span className="text-destructive">*</span>
        </Label>
        <Input
          id="json-file"
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
        <p className="text-sm text-muted-foreground">
          Wählen Sie eine JSON-Datei mit den Dokumentdaten aus. Die Datei sollte ein Array von Objekten mit "title" und "content" Feldern enthalten.
        </p>
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
          disabled={isUploading || !file}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>Wird hochgeladen...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>JSON hochladen</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 