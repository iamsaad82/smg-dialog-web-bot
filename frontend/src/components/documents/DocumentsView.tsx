import React from 'react';
import { useDocuments } from './context/DocumentsProvider';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { AlertCircle, FileUp, RefreshCw, Filter, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from 'next/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import DocumentTable from './table/DocumentTable';
import DocumentFilters from './filters/DocumentFilters';
import DocumentUploadModal from './modals/DocumentUploadModal';
import DocumentDetailModal from './modals/DocumentDetailModal';

/**
 * Hauptkomponente für die Dokumentenansicht
 * Diese Komponente zeigt die Dokumentenliste, Filter und Aktionen an
 */
export default function DocumentsView() {
  const router = useRouter();
  const {
    // Daten
    tenant,
    filteredDocuments,
    selectedDocuments,
    documentStatus,
    // Status
    loading,
    error,
    // Filter
    titleFilter,
    statusFilter,
    categoryFilter,
    // Modals
    isUploadModalOpen,
    isDetailModalOpen,
    selectedDocument,
    viewOnlyMode,
    // Funktionen
    setTitleFilter,
    setStatusFilter,
    setCategoryFilter,
    selectDocument,
    selectAllDocuments,
    viewDocument,
    editDocument,
    deleteDocument,
    reindexDocument,
    // Bulk-Operationen
    reindexSelectedDocuments,
    reindexAllDocuments,
    deleteSelectedDocuments,
    // Modal-Steuerung
    openUploadModal,
    closeUploadModal,
    closeDetailModal,
    // Filter-Funktionen
    resetFilters
  } = useDocuments();

  // Anzahl der ausgewählten Dokumente
  const selectedCount = selectedDocuments.length;
  
  // Prüfen, ob alle gefilterten Dokumente ausgewählt sind
  const allSelected = filteredDocuments.length > 0 && 
    selectedCount === filteredDocuments.length;

  // Aktionen für Bulk-Operationen
  const renderBulkActions = () => {
    if (selectedCount === 0) return null;
    
    return (
      <div className="flex items-center space-x-2 mt-2">
        <Badge variant="secondary">{selectedCount} ausgewählt</Badge>
        <Button 
          variant="outline" 
          size="sm"
          onClick={reindexSelectedDocuments}
          className="flex items-center gap-1"
        >
          <RefreshCw size={16} />
          <span>Indizieren</span>
        </Button>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={deleteSelectedDocuments}
          className="flex items-center gap-1"
        >
          <Trash2 size={16} />
          <span>Löschen</span>
        </Button>
      </div>
    );
  };

  // Render-Methode
  return (
    <>
      <div className="flex flex-col space-y-4">
        {/* Header-Bereich mit Titel und Aktionen */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dokumente</h1>
            <p className="text-muted-foreground">
              Dokumentenverwaltung für {tenant?.name || '...'}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={openUploadModal}
              className="flex items-center gap-2"
            >
              <FileUp size={16} />
              <span>Dokument hochladen</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={reindexAllDocuments}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              <span>Alle indizieren</span>
            </Button>
          </div>
        </div>

        {/* Fehleranzeige */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filter-Bereich */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filter</CardTitle>
                <CardDescription>
                  Filtern Sie die Dokumente nach Titel, Status oder Kategorie
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="flex items-center gap-1"
              >
                <Filter size={16} />
                <span>Zurücksetzen</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DocumentFilters
              titleFilter={titleFilter}
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              setTitleFilter={setTitleFilter}
              setStatusFilter={setStatusFilter}
              setCategoryFilter={setCategoryFilter}
            />
          </CardContent>
        </Card>

        {/* Bulk-Aktionen */}
        {renderBulkActions()}

        {/* Dokumenten-Tabelle */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Dokumenten-Liste</CardTitle>
            <CardDescription>
              {filteredDocuments.length} Dokumente gefunden
              {filteredDocuments.length >= 1000 && (
                <div className="mt-2 text-amber-500">
                  <AlertCircle className="inline-block h-3 w-3 mr-1" />
                  Hinweis: Es werden maximal 1000 Dokumente angezeigt. Falls Sie mehr Dokumente haben, verwenden Sie bitte die Filter, um Ihre Suche einzugrenzen.
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
                <span className="ml-2">Dokumente werden geladen...</span>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                {titleFilter || statusFilter || categoryFilter ? (
                  <p>Keine Dokumente gefunden, die den Filterkriterien entsprechen.</p>
                ) : (
                  <p>Keine Dokumente vorhanden. Laden Sie neue Dokumente hoch.</p>
                )}
              </div>
            ) : (
              <DocumentTable
                documents={filteredDocuments}
                documentStatus={documentStatus}
                selectedDocuments={selectedDocuments}
                allSelected={allSelected}
                onSelectDocument={selectDocument}
                onSelectAll={selectAllDocuments}
                onViewDocument={viewDocument}
                onEditDocument={editDocument}
                onDeleteDocument={deleteDocument}
                onReindexDocument={reindexDocument}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {isUploadModalOpen && (
        <DocumentUploadModal
          isOpen={isUploadModalOpen}
          onClose={closeUploadModal}
        />
      )}

      {isDetailModalOpen && selectedDocument && (
        <DocumentDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          document={selectedDocument}
          viewOnly={viewOnlyMode}
        />
      )}
    </>
  );
} 