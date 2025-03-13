import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDocuments } from '../../context/DocumentsProvider';
import { FileUp, Upload } from 'lucide-react';
import { toast } from '@/utils/toast';

/**
 * Komponente für das Hochladen von CSV-Dokumenten
 */
export default function CsvDocumentUpload() {
  const { bulkUpload, closeUploadModal, isUploading } = useDocuments();
  
  // Formularfelder
  const [files, setFiles] = useState<File[]>([]);
  const [titleColumn, setTitleColumn] = useState('title');
  const [contentColumn, setContentColumn] = useState('content');
  const [sourceColumn, setSourceColumn] = useState('');
  
  // Datei-Input-Referenz
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dateien auswählen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    if (selectedFiles.length > 0) {
      // Überprüfen, ob es sich um CSV-Dateien handelt
      const invalidFiles = selectedFiles.filter(file => !file.name.toLowerCase().endsWith('.csv'));
      
      if (invalidFiles.length > 0) {
        toast.error('Ungültige Dateiformate', {
          description: `${invalidFiles.length} Datei(en) sind keine CSV-Dateien.`
        });
        
        // Nur gültige CSV-Dateien behalten
        const validFiles = selectedFiles.filter(file => file.name.toLowerCase().endsWith('.csv'));
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
  
  // CSV-Dateien hochladen
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Keine Dateien ausgewählt', {
        description: 'Bitte wählen Sie mindestens eine CSV-Datei aus.'
      });
      return;
    }
    
    try {
      // Optionen für den CSV-Upload
      const options = {
        titleColumn,
        contentColumn,
        sourceColumn: sourceColumn || undefined
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
        await bulkUpload(file, 'csv', options);
      }
      
      // Erfolgsmeldung anzeigen
      if (files.length > 1) {
        toast.success(`${files.length} CSV-Dateien wurden hochgeladen`, {
          description: 'Alle Dateien wurden erfolgreich importiert.'
        });
      }
      
      // Formular zurücksetzen und Modal schließen
      setFiles([]);
      setTitleColumn('title');
      setContentColumn('content');
      setSourceColumn('');
      
      // Datei-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      closeUploadModal();
    } catch (error) {
      console.error('Fehler beim Hochladen der CSV-Dateien:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* CSV-Datei-Upload */}
      <div className="space-y-2">
        <Label htmlFor="csv-file">
          CSV-Datei(en) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
          multiple
        />
        <p className="text-sm text-muted-foreground">
          Wählen Sie eine oder mehrere CSV-Dateien mit den Dokumentdaten aus. Die Dateien sollten mindestens eine Spalte für den Titel und eine für den Inhalt enthalten.
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
      
      {/* Spalten-Konfiguration */}
      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-medium">Spaltenzuordnung</h3>
        
        {/* Titel-Spalte */}
        <div className="space-y-2">
          <Label htmlFor="title-column">
            Titel-Spalte <span className="text-destructive">*</span>
          </Label>
          <Input
            id="title-column"
            value={titleColumn}
            onChange={(e) => setTitleColumn(e.target.value)}
            placeholder="Name der Spalte für den Titel"
            disabled={isUploading}
          />
        </div>
        
        {/* Inhalts-Spalte */}
        <div className="space-y-2">
          <Label htmlFor="content-column">
            Inhalts-Spalte <span className="text-destructive">*</span>
          </Label>
          <Input
            id="content-column"
            value={contentColumn}
            onChange={(e) => setContentColumn(e.target.value)}
            placeholder="Name der Spalte für den Inhalt"
            disabled={isUploading}
          />
        </div>
        
        {/* Quellen-Spalte */}
        <div className="space-y-2">
          <Label htmlFor="source-column">Quellen-Spalte (optional)</Label>
          <Input
            id="source-column"
            value={sourceColumn}
            onChange={(e) => setSourceColumn(e.target.value)}
            placeholder="Name der Spalte für die Quelle"
            disabled={isUploading}
          />
        </div>
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
          disabled={isUploading || files.length === 0 || !titleColumn || !contentColumn}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>Wird hochgeladen...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>{files.length > 1 ? `${files.length} CSV-Dateien hochladen` : "CSV hochladen"}</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 