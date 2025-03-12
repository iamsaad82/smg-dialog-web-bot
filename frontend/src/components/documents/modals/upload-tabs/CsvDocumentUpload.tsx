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
  const [file, setFile] = useState<File | null>(null);
  const [titleColumn, setTitleColumn] = useState('title');
  const [contentColumn, setContentColumn] = useState('content');
  const [sourceColumn, setSourceColumn] = useState('');
  
  // Datei-Input-Referenz
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Datei auswählen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Überprüfen, ob es sich um eine CSV-Datei handelt
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        toast.error('Ungültiges Dateiformat', {
          description: 'Bitte wählen Sie eine CSV-Datei aus.'
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
  
  // CSV-Datei hochladen
  const handleUpload = async () => {
    if (!file) {
      toast.error('Keine Datei ausgewählt', {
        description: 'Bitte wählen Sie eine CSV-Datei aus.'
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
      
      // Datei hochladen
      await bulkUpload(file, 'csv', options);
      
      // Formular zurücksetzen und Modal schließen
      setFile(null);
      setTitleColumn('title');
      setContentColumn('content');
      setSourceColumn('');
      
      // Datei-Input zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      closeUploadModal();
    } catch (error) {
      console.error('Fehler beim Hochladen der CSV-Datei:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* CSV-Datei-Upload */}
      <div className="space-y-2">
        <Label htmlFor="csv-file">
          CSV-Datei <span className="text-destructive">*</span>
        </Label>
        <Input
          id="csv-file"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={isUploading}
          ref={fileInputRef}
        />
        <p className="text-sm text-muted-foreground">
          Wählen Sie eine CSV-Datei mit den Dokumentdaten aus. Die Datei sollte mindestens eine Spalte für den Titel und eine für den Inhalt enthalten.
        </p>
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
          disabled={isUploading || !file || !titleColumn || !contentColumn}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>Wird hochgeladen...</>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>CSV hochladen</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 