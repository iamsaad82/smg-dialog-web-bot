import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useDocuments } from '../context/DocumentsProvider';
import { File, FileText, Table } from 'lucide-react';
import SingleDocumentUpload from './upload-tabs/SingleDocumentUpload';
import CsvDocumentUpload from './upload-tabs/CsvDocumentUpload';
import JsonDocumentUpload from './upload-tabs/JsonDocumentUpload';
import MarkdownDocumentUpload from './upload-tabs/MarkdownDocumentUpload';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal für das Hochladen von Dokumenten
 * Enthält Tabs für verschiedene Upload-Typen
 */
export default function DocumentUploadModal({
  isOpen,
  onClose
}: DocumentUploadModalProps) {
  const { isUploading, uploadProgress } = useDocuments();
  const [activeTab, setActiveTab] = useState<string>('single');
  
  // Wenn eine Upload-Operation läuft, zeigen wir eine Fortschrittsanzeige an
  const renderUploadProgress = () => {
    if (!isUploading) return null;
    
    return (
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-sm mb-1">
          <span>Dokument wird hochgeladen...</span>
          <span>{uploadProgress}%</span>
        </div>
        <Progress value={uploadProgress} className="w-full" />
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dokument hochladen</DialogTitle>
          <DialogDescription>
            Laden Sie ein einzelnes Dokument oder mehrere Dokumente über CSV, JSON oder Markdown hoch.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="single" disabled={isUploading} className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Einzeln</span>
            </TabsTrigger>
            <TabsTrigger value="csv" disabled={isUploading} className="flex items-center gap-1">
              <Table className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </TabsTrigger>
            <TabsTrigger value="json" disabled={isUploading} className="flex items-center gap-1">
              <File className="h-4 w-4" />
              <span className="hidden sm:inline">JSON</span>
            </TabsTrigger>
            <TabsTrigger value="markdown" disabled={isUploading} className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Markdown</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Einzelnes Dokument hochladen */}
          <TabsContent value="single">
            <SingleDocumentUpload />
          </TabsContent>
          
          {/* CSV-Dokumente hochladen */}
          <TabsContent value="csv">
            <CsvDocumentUpload />
          </TabsContent>
          
          {/* JSON-Dokumente hochladen */}
          <TabsContent value="json">
            <JsonDocumentUpload />
          </TabsContent>
          
          {/* Markdown-Dokumente hochladen */}
          <TabsContent value="markdown">
            <MarkdownDocumentUpload />
          </TabsContent>
        </Tabs>
        
        {/* Fortschrittsanzeige während des Uploads */}
        {renderUploadProgress()}
      </DialogContent>
    </Dialog>
  );
} 