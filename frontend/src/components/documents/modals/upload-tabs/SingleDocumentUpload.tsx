import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DocumentCreate } from '@/types/api';
import { useDocuments } from '../../context/DocumentsProvider';
import { FileUp, Save } from 'lucide-react';

/**
 * Komponente für das Hochladen eines einzelnen Dokuments
 */
export default function SingleDocumentUpload() {
  const { uploadDocument, closeUploadModal, isUploading } = useDocuments();
  
  // Formularfelder
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [source, setSource] = useState('');
  const [category, setCategory] = useState('');
  const [autoIndex, setAutoIndex] = useState(true);
  
  // Validierungsstatus
  const [titleError, setTitleError] = useState('');
  const [contentError, setContentError] = useState('');
  
  // Formular zurücksetzen
  const resetForm = () => {
    setTitle('');
    setContent('');
    setSource('');
    setCategory('');
    setAutoIndex(true);
    setTitleError('');
    setContentError('');
  };
  
  // Formular validieren
  const validateForm = () => {
    let valid = true;
    
    if (!title.trim()) {
      setTitleError('Bitte geben Sie einen Titel ein.');
      valid = false;
    } else {
      setTitleError('');
    }
    
    if (!content.trim()) {
      setContentError('Bitte geben Sie einen Inhalt ein.');
      valid = false;
    } else {
      setContentError('');
    }
    
    return valid;
  };
  
  // Hochladen eines Dokuments
  const handleUpload = async () => {
    if (!validateForm()) return;
    
    const document: DocumentCreate = {
      title,
      content,
      source: source || undefined,
      metadata: category 
        ? { category } 
        : undefined,
      auto_index: autoIndex
    };
    
    try {
      // Dokument hochladen und speichern
      const result = await uploadDocument(document);
      
      // Formular zurücksetzen und Modal schließen
      resetForm();
      closeUploadModal();
    } catch (error) {
      console.error('Fehler beim Hochladen:', error);
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Titel-Eingabefeld */}
      <div className="space-y-2">
        <Label htmlFor="title">
          Titel <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Dokumenttitel eingeben"
          disabled={isUploading}
        />
        {titleError && (
          <p className="text-sm text-destructive">{titleError}</p>
        )}
      </div>
      
      {/* Inhalts-Eingabefeld */}
      <div className="space-y-2">
        <Label htmlFor="content">
          Inhalt <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Dokumentinhalt eingeben"
          rows={8}
          disabled={isUploading}
        />
        {contentError && (
          <p className="text-sm text-destructive">{contentError}</p>
        )}
      </div>
      
      {/* Quellen-Eingabefeld */}
      <div className="space-y-2">
        <Label htmlFor="source">Quelle</Label>
        <Input
          id="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Optionale Quellenangabe"
          disabled={isUploading}
        />
      </div>
      
      {/* Kategorie-Eingabefeld */}
      <div className="space-y-2">
        <Label htmlFor="category">Kategorie</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Optionale Kategorie"
          disabled={isUploading}
        />
      </div>
      
      {/* Auto-Indizierung Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="auto-index"
          checked={autoIndex}
          onCheckedChange={(checked) => setAutoIndex(!!checked)}
          disabled={isUploading}
        />
        <Label
          htmlFor="auto-index"
          className="text-sm font-normal"
        >
          Dokument automatisch indizieren
        </Label>
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
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>Wird hochgeladen...</>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              <span>Hochladen</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
} 