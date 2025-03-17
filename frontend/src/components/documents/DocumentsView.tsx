import React, { useState } from 'react';
import { useDocuments } from './context/DocumentsProvider';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AlertCircle, FileUp, RefreshCw, Filter, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from 'next/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import DocumentTable from './table/DocumentTable';
import DocumentFilters from './filters/DocumentFilters';
import DocumentUploadModal from './modals/DocumentUploadModal';
import DocumentDetailModal from './modals/DocumentDetailModal';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Hauptkomponente für die Dokumentenansicht
 * Diese Komponente zeigt die Dokumentenliste, Filter und Aktionen an
 */
export default function DocumentsView() {
  const router = useRouter();
  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  
  const {
    // Daten
    tenant,
    documents,
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

  // Paginierte Dokumente
  const paginatedDocuments = React.useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredDocuments.slice(startIndex, startIndex + pageSize);
  }, [filteredDocuments, page, pageSize]);

  // Gesamtanzahl der Seiten
  const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / pageSize));

  // Seite wechseln
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Bei Seitenwechsel nach oben scrollen
      window.scrollTo(0, 0);
    }
  };

  // Anzahl der ausgewählten Dokumente
  const selectedCount = selectedDocuments.length;
  
  // Prüfen, ob alle Dokumente auf der aktuellen Seite ausgewählt sind
  const allSelected = paginatedDocuments.length > 0 && 
    paginatedDocuments.every(doc => selectedDocuments.includes(doc.id));

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

  // Seitenwechsler rendern
  const renderPagination = () => {
    if (filteredDocuments.length <= pageSize) return null;
    
    return (
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => changePage(page - 1)}
              className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          <div className="flex items-center gap-2 px-2">
            <span>Seite</span>
            <strong>{page}</strong>
            <span>von</span>
            <strong>{totalPages}</strong>
          </div>
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => changePage(page + 1)}
              className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
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
          <Alert 
            variant={error.includes("nicht verfügbar") ? "default" : "destructive"}
            className={error.includes("nicht verfügbar") ? "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800" : ""}
          >
            <AlertCircle className={error.includes("nicht verfügbar") ? "h-4 w-4 text-yellow-500" : "h-4 w-4"} />
            <AlertDescription className={error.includes("nicht verfügbar") ? "text-yellow-700 dark:text-yellow-300" : ""}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Infobox wenn viele Dokumente vorhanden sind */}
        {filteredDocuments.length > 100 && (
          <Alert variant="default" className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertCircle className="h-4 w-4 text-blue-500" />
            <AlertDescription className="text-blue-700 dark:text-blue-300">
              Sie haben {filteredDocuments.length} Dokumente. Verwenden Sie die Filter und Paginierung, um die Anzeige zu organisieren.
            </AlertDescription>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <CardTitle>Dokumenten-Liste</CardTitle>
                <CardDescription>
                  {error && error.includes("nicht verfügbar") ? (
                    "Dokumenten-Service ist nicht verfügbar"
                  ) : (
                    `${filteredDocuments.length} Dokumente gefunden, 
                    zeige ${paginatedDocuments.length} Dokumente auf Seite ${page} von ${totalPages}`
                  )}
                </CardDescription>
              </div>
              
              {/* Dokumenten pro Seite Auswahl */}
              <div className="flex items-center space-x-2 mt-2 md:mt-0">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Dokumente pro Seite:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setPage(1); // Zurück zur ersten Seite
                  }}
                >
                  <SelectTrigger className="w-[80px]">
                    <SelectValue placeholder="50" />
                  </SelectTrigger>
                  <SelectContent side="top">
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner />
                <span className="ml-2">Dokumente werden geladen...</span>
              </div>
            ) : error && error.includes("nicht verfügbar") ? (
              <div className="text-center py-8 px-4">
                <div className="mb-4">
                  <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                  <h3 className="text-lg font-medium">Dokument-Verwaltung nicht verfügbar</h3>
                </div>
                <p className="text-muted-foreground mb-2">
                  Die Dokument-Verwaltungsfunktion ist in diesem System derzeit nicht verfügbar oder nicht konfiguriert.
                </p>
                <p className="text-sm text-muted-foreground">
                  Wenn Sie glauben, dass dies ein Fehler ist, kontaktieren Sie bitte Ihren Administrator.
                </p>
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
                documents={paginatedDocuments}
                documentStatus={documentStatus}
                selectedDocuments={selectedDocuments}
                allSelected={allSelected}
                onSelectDocument={selectDocument}
                onSelectAll={(selected) => {
                  // Nur die Dokumente auf der aktuellen Seite auswählen/abwählen
                  paginatedDocuments.forEach(doc => {
                    selectDocument(doc.id, selected);
                  });
                }}
                onViewDocument={viewDocument}
                onEditDocument={editDocument}
                onDeleteDocument={deleteDocument}
                onReindexDocument={reindexDocument}
              />
            )}
          </CardContent>
          
          {/* Paginierung am unteren Rand */}
          {!loading && filteredDocuments.length > 0 && (
            <CardFooter className="flex items-center justify-between py-4 border-t">
              <div className="text-sm text-muted-foreground">
                Zeige {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, filteredDocuments.length)} von {filteredDocuments.length} Dokumenten
              </div>
              {renderPagination()}
            </CardFooter>
          )}
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