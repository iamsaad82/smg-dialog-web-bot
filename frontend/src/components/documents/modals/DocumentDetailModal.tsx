import React, { useState } from 'react';
import { Document } from '@/types/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useDocuments } from '../context/DocumentsProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Code, Edit, Save } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DocumentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  viewOnly: boolean;
}

/**
 * Modal für die Anzeige und Bearbeitung eines Dokuments
 */
export default function DocumentDetailModal({
  isOpen,
  onClose,
  document,
  viewOnly = false
}: DocumentDetailModalProps) {
  const { saveDocument, isSaving } = useDocuments();
  
  // Lokale State-Variablen für die Bearbeitung
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [source, setSource] = useState(document.source || '');
  const [activeTab, setActiveTab] = useState<string>(viewOnly ? 'preview' : 'edit');
  
  // Überprüfung, ob Änderungen vorgenommen wurden
  const hasChanges = title !== document.title || 
    content !== document.content || 
    source !== (document.source || '');
  
  // Handler für das Speichern des Dokuments
  const handleSave = async () => {
    await saveDocument(document.id, { title, content, source });
  };
  
  // Metadaten des Dokuments für die Anzeige
  const renderMetadata = () => {
    if (!document.doc_metadata || Object.keys(document.doc_metadata).length === 0) {
      return <p className="text-muted-foreground">Keine Metadaten vorhanden</p>;
    }
    
    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries(document.doc_metadata).map(([key, value]) => (
          <React.Fragment key={key}>
            <div className="font-medium">{key}:</div>
            <div>{String(value)}</div>
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{viewOnly ? 'Dokument anzeigen' : 'Dokument bearbeiten'}</DialogTitle>
          <DialogDescription>
            {viewOnly 
              ? 'Detailansicht des Dokuments' 
              : 'Bearbeiten Sie den Titel und Inhalt des Dokuments'}
          </DialogDescription>
        </DialogHeader>
        
        {/* Formular */}
        <div className="py-4 space-y-4">
          {/* Titel-Eingabefeld */}
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={viewOnly || isSaving}
            />
          </div>
          
          {/* Quelle-Eingabefeld */}
          <div className="space-y-2">
            <Label htmlFor="source">Quelle</Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              disabled={viewOnly || isSaving}
              placeholder="Quelle des Dokuments (optional)"
            />
          </div>
          
          {/* Tabs für verschiedene Ansichten */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="edit" disabled={viewOnly}>
                <Edit className="h-4 w-4 mr-2" />
                Bearbeiten
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Vorschau
              </TabsTrigger>
            </TabsList>
            
            {/* Bearbeitungs-Tab */}
            <TabsContent value="edit" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Inhalt</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isSaving}
                  rows={15}
                  className="font-mono"
                />
              </div>
            </TabsContent>
            
            {/* Vorschau-Tab */}
            <TabsContent value="preview" className="space-y-4">
              <div className="border rounded-md p-4 max-h-[400px] overflow-auto">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
              
              {/* Metadaten-Anzeige */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Metadaten</h3>
                {renderMetadata()}
              </div>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Footer mit Aktionen */}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {viewOnly ? 'Schließen' : 'Abbrechen'}
          </Button>
          
          {!viewOnly && (
            <Button 
              onClick={handleSave} 
              disabled={!hasChanges || isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 