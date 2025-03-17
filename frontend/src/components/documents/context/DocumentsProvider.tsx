import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/api";
import { Document, Tenant, DocumentCreate, IndexStatus } from "@/types/api";
import { toast } from "@/utils/toast";

// Definieren Sie den Typ für den Dokumentenstatus
interface DocumentStatusMap {
  [key: string]: {
    status: IndexStatus;
    lastUpdated?: string;
    error?: string;
  };
}

// Definieren Sie die Schnittstelle für den Dokumenten-Kontext
interface DocumentsContextType {
  // Daten
  tenant: Tenant | null;
  documents: Document[];
  filteredDocuments: Document[];
  selectedDocuments: string[];
  documentStatus: DocumentStatusMap;
  categories: string[];
  
  // Status
  loading: boolean;
  error: string | null;
  isUploading: boolean;
  uploadProgress: number;
  isSaving: boolean;
  
  // Filter
  titleFilter: string;
  statusFilter: string;
  categoryFilter: string;
  
  // Modal-States
  isUploadModalOpen: boolean;
  isDetailModalOpen: boolean;
  selectedDocument: Document | null;
  viewOnlyMode: boolean;
  
  // Funktionen
  setTitleFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setCategoryFilter: (value: string) => void;
  setSelectedDocuments: (documents: string[]) => void;
  
  // Dokumentenoperationen
  selectDocument: (docId: string, selected: boolean) => void;
  selectAllDocuments: (selected: boolean) => void;
  viewDocument: (document: Document) => void;
  editDocument: (document: Document) => void;
  deleteDocument: (documentId: string) => Promise<void>;
  reindexDocument: (documentId: string) => Promise<void>;
  uploadDocument: (document: DocumentCreate, options?: any) => Promise<any>;
  bulkUpload: (file: File, fileType: 'csv' | 'json' | 'markdown' | 'pdf', options?: any) => Promise<void>;
  saveDocument: (documentId: string, updates: { title: string; content: string; source?: string }) => Promise<void>;
  
  // Bulk-Operationen
  reindexSelectedDocuments: () => Promise<void>;
  reindexAllDocuments: () => Promise<void>;
  deleteSelectedDocuments: () => Promise<void>;
  
  // Modal-Steuerung
  openUploadModal: () => void;
  closeUploadModal: () => void;
  closeDetailModal: () => void;
  
  // Filter-Funktionen
  resetFilters: () => void;
}

// Erstellen Sie den Kontext
const DocumentsContext = createContext<DocumentsContextType | undefined>(undefined);

// Provider-Komponente
export const DocumentsProvider: React.FC<{ children: React.ReactNode; tenantId: string }> = ({ 
  children, 
  tenantId 
}) => {
  // State für Daten
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  
  // Status-States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter-States
  const [titleFilter, setTitleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // Modal-States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(true);
  
  // Upload-States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  
  // Dokumenten-Status
  const [documentStatus, setDocumentStatus] = useState<DocumentStatusMap>({});
  
  // Mounted-Status für Client-Side-only API-Aufrufe
  const [isMounted, setIsMounted] = useState(false);
  
  // Setzen des mounted-Status, wenn die Komponente geladen ist
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Kategorien aus Metadaten extrahieren
  const categories = React.useMemo(() => {
    const categorySet = new Set<string>();
    documents.forEach(doc => {
      if (doc.doc_metadata && doc.doc_metadata.category) {
        categorySet.add(doc.doc_metadata.category as string);
      }
    });
    return Array.from(categorySet);
  }, [documents]);

  // Gefilterte Dokumente
  const filteredDocuments = React.useMemo(() => {
    return documents.filter(doc => {
      // Text-Filter anwenden
      if (titleFilter && !doc.title.toLowerCase().includes(titleFilter.toLowerCase())) {
        return false;
      }
      
      // Status-Filter anwenden
      if (statusFilter === 'indexed' && 
          (!documentStatus[doc.id] || documentStatus[doc.id].status !== IndexStatus.INDIZIERT)) {
        return false;
      }
      
      if (statusFilter === 'unindexed' && 
          (documentStatus[doc.id] && documentStatus[doc.id].status === IndexStatus.INDIZIERT)) {
        return false;
      }
      
      // Kategorie-Filter anwenden
      if (categoryFilter && categoryFilter !== 'all' && doc.doc_metadata?.category !== categoryFilter) {
        return false;
      }
      
      return true;
    });
  }, [documents, titleFilter, statusFilter, categoryFilter, documentStatus]);

  // Laden der Daten - nur auf der Client-Seite
  useEffect(() => {
    if (!tenantId || !isMounted) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Tenant abrufen mit aktualisierter API
        try {
          // Direkt versuchen, den spezifischen Tenant zu laden
          try {
            console.log(`Versuche direkten Tenant-Abruf für ID ${tenantId}`);
            const tenantData = await api.getTenant(tenantId);
            if (tenantData) {
              api.setApiKey(tenantData.api_key);
              setTenant(tenantData);
              console.log("Tenant direkt geladen:", tenantData);
            }
          } catch (directErr) {
            console.log("Direkter Tenant-Abruf fehlgeschlagen, versuche alle Tenants zu laden:", directErr);
            
            // Fallback-Methode: Alle Tenants laden
            const allTenants = await api.getAllTenants();
            const currentTenant = allTenants.find(t => t.id === tenantId);
            
            if (!currentTenant) {
              setError("Tenant nicht gefunden");
              setLoading(false);
              return;
            }

            // API-Key für den Tenant setzen
            api.setApiKey(currentTenant.api_key);
            setTenant(currentTenant);
          }
        } catch (err) {
          console.error('Fehler beim Laden des Tenants:', err);
          setError('Fehler beim Laden der Kundendaten');
          setLoading(false);
          return;
        }

        // Dokumente abrufen
        try {
          const documentsData = await api.getDocuments(tenantId);
          setDocuments(documentsData);
          
          // Dokumentenstatus abrufen
          if (documentsData.length > 0) {
            const statusPromises = documentsData.map(async (doc) => {
              try {
                const status = await api.getDocumentWeaviateStatus(tenantId, doc.id);
                
                // Wenn der Status einen Backend-Fehler enthält, setzen wir einen Standardstatus
                if (status.error && status.error.includes("unexpected keyword")) {
                  console.log(`Backend-Fehler bei Dokument ${doc.id}, setze Standardstatus`);
                  return {
                    docId: doc.id,
                    status: {
                      status: IndexStatus.NICHT_INDIZIERT,
                      error: undefined
                    }
                  };
                }
                
                return {
                  docId: doc.id,
                  status
                };
              } catch (error) {
                console.error(`Fehler beim Abrufen des Status für Dokument ${doc.id}:`, error);
                return {
                  docId: doc.id,
                  status: {
                    status: IndexStatus.NICHT_INDIZIERT,
                    error: "Fehler beim Abrufen des Status"
                  }
                };
              }
            });
            
            // Alle Status-Promises auflösen
            const statusResults = await Promise.all(statusPromises);
            
            // Status-Map erstellen
            const newDocumentStatus: DocumentStatusMap = {};
            statusResults.forEach(result => {
              newDocumentStatus[result.docId] = result.status;
            });
            
            setDocumentStatus(newDocumentStatus);
          }
        } catch (err: any) {
          // Spezielle Behandlung für 404-Fehler vom Backend
          if (err.message && (err.message.includes("404 Not Found") || err.message.includes("Not Found"))) {
            console.warn('Dokumenten-Endpunkt nicht verfügbar (404 Not Found):', err);
            // Leere Dokumentenliste setzen, aber keinen Fehler auslösen
            setDocuments([]);
            setError("Der Dokumenten-Service ist derzeit nicht verfügbar oder wurde noch nicht konfiguriert. Bitte kontaktieren Sie Ihren Administrator.");
          } else {
            console.error('Fehler beim Laden der Dokumente:', err);
            setError('Fehler beim Laden der Dokumente: ' + (err.message || 'Unbekannter Fehler'));
          }
          
          // Wir setzen loading auf false, behalten aber die Tenant-Daten bei
          setLoading(false);
          return;
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Fehler beim Laden der Daten:", err);
        setError("Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [tenantId, isMounted]);

  // Dokumentauswahl
  const selectDocument = (docId: string, selected: boolean) => {
    if (selected) {
      setSelectedDocuments(prev => [...prev, docId]);
    } else {
      setSelectedDocuments(prev => prev.filter(id => id !== docId));
    }
  };

  // Alle Dokumente auswählen
  const selectAllDocuments = (selected: boolean) => {
    if (selected) {
      setSelectedDocuments(filteredDocuments.map(doc => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  // Dokument ansehen
  const viewDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewOnlyMode(true);
    setIsDetailModalOpen(true);
  };

  // Dokument bearbeiten
  const editDocument = (document: Document) => {
    setSelectedDocument(document);
    setViewOnlyMode(false);
    setIsDetailModalOpen(true);
  };

  // Dokument löschen
  const deleteDocument = async (documentId: string) => {
    if (!tenantId || !tenant) return;
    
    try {
      await api.deleteDocument(tenantId, documentId);
      
      // Nach erfolgreicher Löschung aus Liste entfernen
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setSelectedDocuments(prev => prev.filter(docId => docId !== documentId));
      
      toast.success("Dokument erfolgreich gelöscht");
    } catch (error) {
      console.error("Fehler beim Löschen des Dokuments:", error);
      toast.error(`Fehler beim Löschen: ${(error as Error).message}`);
    }
  };

  // Dokument reindexieren
  const reindexDocument = async (documentId: string) => {
    if (!tenantId) {
      console.error('Reindexing failed: No tenant ID available');
      setError('Kein Tenant ausgewählt');
      return;
    }

    // Fehler zurücksetzen
    setError(null);

    try {
      console.log(`Reindexiere Dokument ${documentId}`);
      
      // Status auf "Wird indiziert" setzen
      setDocumentStatus(prev => ({
        ...prev,
        [documentId]: {
          status: IndexStatus.WIRD_INDIZIERT,
          lastUpdated: new Date().toISOString()
        }
      }));
      
      // Dokument neu indizieren
      try {
        await api.reindexDocument(tenantId, documentId);
        
        // Status nach kurzer Verzögerung prüfen, um dem Backend Zeit zu geben
        setTimeout(async () => {
          // Weaviate-Status abrufen
          const statusResult = await api.getWeaviateStatus(tenantId, documentId);
          
          // Status im State aktualisieren
          setDocumentStatus(prev => ({
            ...prev,
            [documentId]: {
              status: statusResult.status === 'unknown' ? IndexStatus.NICHT_INDIZIERT : statusResult.status,
              error: statusResult.error,
              lastUpdated: new Date().toISOString()
            }
          }));
          
          // UI-Feedback geben
          if (statusResult.status === 'unknown' || statusResult.error) {
            console.warn(`Unklarer Status für Dokument ${documentId} nach Reindexierung: ${statusResult.error || 'Status unbekannt'}`);
            toast.warning('Reindexierung gestartet, aber der Status konnte nicht abgerufen werden');
          } else if (statusResult.status === IndexStatus.INDIZIERT) {
            console.log(`Dokument ${documentId} erfolgreich indiziert`);
            toast.success('Dokument erfolgreich indiziert');
          } else {
            console.log(`Dokument ${documentId} wird indiziert...`);
            toast.info('Indizierung wurde gestartet');
          }
        }, 2000); // 2 Sekunden warten
      } catch (reindexError) {
        console.error(`Fehler bei der Reindexierung von Dokument ${documentId}:`, reindexError);
        setError('Fehler bei der Reindexierung');
        toast.error('Reindexierung fehlgeschlagen');
        
        // Status auf Fehler setzen
        setDocumentStatus(prev => ({
          ...prev,
          [documentId]: {
            status: IndexStatus.FEHLER,
            error: reindexError instanceof Error ? reindexError.message : 'Reindexierung fehlgeschlagen',
            lastUpdated: new Date().toISOString()
          }
        }));
      }
    } catch (error) {
      console.error('Error reindexing document:', error);
      setError('Fehler bei der Dokumentreindexierung');
      toast.error('Dokumentreindexierung fehlgeschlagen');
      
      // Fehler im Status aktualisieren
      setDocumentStatus(prev => ({
        ...prev,
        [documentId]: {
          status: IndexStatus.FEHLER,
          error: error instanceof Error ? error.message : 'Unbekannter Fehler',
          lastUpdated: new Date().toISOString()
        }
      }));
    }
  };

  // Dokument erstellen
  const uploadDocument = async (document: DocumentCreate, options?: any) => {
    if (!tenantId || !tenant) return;
    
    try {
      setIsUploading(true);
      
      // Tatsächlichen API-Call machen
      const result = await api.createDocument(document);
      
      // Bei Erfolg die Dokumente neu laden
      const documentsData = await api.getDocuments(tenantId);
      setDocuments(documentsData);
      
      toast.success("Dokument erfolgreich erstellt");
      return result; // Dokument zurückgeben für die automatische Indizierung
    } catch (error) {
      console.error("Fehler beim Erstellen des Dokuments:", error);
      toast.error("Fehler beim Erstellen des Dokuments");
    } finally {
      setIsUploading(false);
    }
  };

  // Bulk Upload Handler
  const bulkUpload = async (file: File, fileType: 'csv' | 'json' | 'markdown' | 'pdf', options?: any) => {
    if (!tenantId || !tenant) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Verwende die passende API-Methode basierend auf dem Dateityp
      switch (fileType) {
        case 'csv':
          await api.uploadCsv(
            tenantId,
            file, 
            options?.titleColumn || 'title', 
            options?.contentColumn || 'content', 
            options?.sourceColumn
          );
          break;
          
        case 'json':
          await api.uploadJson(tenantId, file);
          break;
          
        case 'markdown':
          await api.uploadMarkdown(tenantId, file, options?.source);
          break;
          
        case 'pdf':
          await api.uploadPdf(tenantId, file, options?.source);
          break;
          
        default:
          throw new Error(`Nicht unterstütztes Dateiformat: ${fileType}`);
      }
      
      // Setze Fortschritt auf 100%
      setUploadProgress(100);
      
      // Lade die Dokumente neu
      const documentsData = await api.getDocuments(tenantId);
      setDocuments(documentsData);
      
      // Hole Status für neue Dokumente
      const statusMap = { ...documentStatus };
      const newDocIds = documentsData
        .filter(doc => !documentStatus[doc.id])
        .map(doc => doc.id);
      
      // Status für neue Dokumente abrufen
      if (newDocIds.length > 0) {
        const statusPromises = newDocIds.map(async (docId) => {
          try {
            const status = await api.getDocumentWeaviateStatus(tenantId, docId);
            statusMap[docId] = {
              status: status.status || IndexStatus.NICHT_INDIZIERT,
              lastUpdated: status.lastUpdated,
              error: status.error
            };
          } catch (err) {
            console.error(`Fehler beim Abrufen des Status für Dokument ${docId}:`, err);
            statusMap[docId] = {
              status: IndexStatus.FEHLER,
              error: "Status konnte nicht abgerufen werden"
            };
          }
        });
        
        await Promise.allSettled(statusPromises);
        setDocumentStatus(statusMap);
      }
      
      toast.success(`${fileType.toUpperCase()}-Datei wurde erfolgreich hochgeladen.`);
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Fehler beim Upload:', error);
      toast.error(`Fehler beim Upload: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Dokument aktualisieren
  const saveDocument = async (documentId: string, updates: { title: string; content: string; source?: string }) => {
    if (!tenantId || !tenant) return;
    
    setIsSaving(true);
    
    try {
      // Echte API für die Aktualisierung verwenden
      await api.updateDocument(tenantId, documentId, {
        title: updates.title,
        content: updates.content,
        source: updates.source
      });
      
      // Dokument in der Liste aktualisieren
      setDocuments(prev => 
        prev.map(doc => doc.id === documentId ? { ...doc, ...updates } : doc)
      );
      
      toast.success("Dokument erfolgreich gespeichert");
      setIsDetailModalOpen(false);
    } catch (error) {
      console.error("Fehler beim Speichern:", error);
      toast.error(`Fehler beim Speichern: ${(error as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Mehrere Dokumente neu indizieren
  const reindexSelectedDocuments = async () => {
    if (!tenantId || !tenant || selectedDocuments.length === 0) return;
    
    try {
      // Status für alle ausgewählten Dokumente aktualisieren
      const newStatus = { ...documentStatus };
      selectedDocuments.forEach(docId => {
        newStatus[docId] = {
          ...newStatus[docId],
          status: IndexStatus.NICHT_INDIZIERT,
          lastUpdated: undefined
        };
      });
      setDocumentStatus(newStatus);
      
      // Reindiziere jedes ausgewählte Dokument
      const reindexPromises = selectedDocuments.map(docId => 
        api.reindexDocument(tenantId, docId)
      );
      
      await Promise.all(reindexPromises);
      
      // Status-Polling starten
      const checkStatuses = async () => {
        try {
          const statusPromises = selectedDocuments.map(async docId => {
            try {
              return { docId, status: await api.getDocumentWeaviateStatus(tenantId, docId) };
            } catch (error) {
              return { 
                docId, 
                status: { 
                  status: IndexStatus.FEHLER, 
                  error: "Status konnte nicht abgerufen werden"
                } 
              };
            }
          });
          
          const results = await Promise.allSettled(statusPromises);
          
          // Aktualisiere Status
          const newStatus = { ...documentStatus };
          let allDone = true;
          
          results.forEach(result => {
            if (result.status === 'fulfilled') {
              const { docId, status } = result.value;
              newStatus[docId] = {
                status: status.status || IndexStatus.NICHT_INDIZIERT,
                lastUpdated: status.lastUpdated,
                error: status.error
              };
              
              // Prüfe, ob noch Indizierungen laufen
              if (status.status === IndexStatus.NICHT_INDIZIERT) {
                allDone = false;
              }
            }
          });
          
          setDocumentStatus(newStatus);
          
          // Wenn noch Dokumente indiziert werden, erneut prüfen
          if (!allDone) {
            setTimeout(checkStatuses, 2000);
          }
        } catch (error) {
          console.error("Fehler beim Abrufen der Dokumentenstatus:", error);
        }
      };
      
      // Starte das Status-Polling
      setTimeout(checkStatuses, 2000);
      
      toast.success(`Reindexierung von ${selectedDocuments.length} Dokumenten gestartet`);
    } catch (error) {
      console.error("Fehler beim Reindexieren der ausgewählten Dokumente:", error);
      toast.error(`Fehler bei der Reindexierung: ${(error as Error).message}`);
    }
  };

  // Alle Dokumente neu indizieren
  const reindexAllDocuments = async () => {
    if (!tenantId || !tenant) return;
    
    try {
      // Status für alle Dokumente aktualisieren
      const newStatus = { ...documentStatus };
      documents.forEach(doc => {
        newStatus[doc.id] = {
          status: IndexStatus.NICHT_INDIZIERT,
          lastUpdated: undefined
        };
      });
      setDocumentStatus(newStatus);
      
      // Alle Dokumente reindizieren
      await api.reindexAllDocuments(tenantId);
      
      // Status-Polling starten
      const checkAllStatuses = async () => {
        try {
          const statusPromises = documents.map(async doc => {
            try {
              return { docId: doc.id, status: await api.getDocumentWeaviateStatus(tenantId, doc.id) };
            } catch (error) {
              return { 
                docId: doc.id, 
                status: { 
                  status: IndexStatus.FEHLER, 
                  error: "Status konnte nicht abgerufen werden"
                } 
              };
            }
          });
          
          const results = await Promise.allSettled(statusPromises);
          
          // Aktualisiere Status
          const newStatus = { ...documentStatus };
          let allDone = true;
          
          results.forEach(result => {
            if (result.status === 'fulfilled') {
              const { docId, status } = result.value;
              newStatus[docId] = {
                status: status.status || IndexStatus.NICHT_INDIZIERT,
                lastUpdated: status.lastUpdated,
                error: status.error
              };
              
              // Prüfe, ob noch Indizierungen laufen
              if (status.status === IndexStatus.NICHT_INDIZIERT) {
                allDone = false;
              }
            }
          });
          
          setDocumentStatus(newStatus);
          
          // Wenn noch Dokumente indiziert werden, erneut prüfen
          if (!allDone) {
            setTimeout(checkAllStatuses, 3000);
          }
        } catch (error) {
          console.error("Fehler beim Abrufen der Dokumentenstatus:", error);
        }
      };
      
      // Starte das Status-Polling
      setTimeout(checkAllStatuses, 3000);
      
      toast.success("Reindexierung aller Dokumente gestartet");
    } catch (error) {
      console.error("Fehler beim Reindexieren aller Dokumente:", error);
      toast.error(`Fehler bei der Reindexierung: ${(error as Error).message}`);
    }
  };

  // Mehrere Dokumente löschen
  const deleteSelectedDocuments = async () => {
    if (!tenantId || !tenant || selectedDocuments.length === 0) return;
    
    // Benutzer um Bestätigung bitten
    const confirmDelete = window.confirm(`Möchten Sie wirklich ${selectedDocuments.length} Dokumente löschen?`);
    if (!confirmDelete) {
      return;
    }
    
    try {
      // Löschen aller ausgewählten Dokumente
      const deletePromises = selectedDocuments.map(docId => 
        api.deleteDocument(tenantId, docId)
      );
      
      await Promise.all(deletePromises);
      
      // Nach erfolgreicher Löschung aus Liste entfernen
      setDocuments(prev => prev.filter(doc => !selectedDocuments.includes(doc.id)));
      setSelectedDocuments([]);
      
      toast.success(`${selectedDocuments.length} Dokumente erfolgreich gelöscht`);
    } catch (error) {
      console.error("Fehler beim Löschen der ausgewählten Dokumente:", error);
      toast.error(`Fehler beim Löschen: ${(error as Error).message}`);
    }
  };

  // Modal-Steuerung
  const openUploadModal = () => setIsUploadModalOpen(true);
  const closeUploadModal = () => setIsUploadModalOpen(false);
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDocument(null);
  };

  // Filter-Funktionen
  const resetFilters = () => {
    setTitleFilter("");
    setStatusFilter("all");
    setCategoryFilter("all");
  };

  // Kontext-Wert
  const value: DocumentsContextType = {
    tenant,
    documents,
    filteredDocuments,
    selectedDocuments,
    documentStatus,
    categories,
    
    loading,
    error,
    isUploading,
    uploadProgress,
    isSaving,
    
    titleFilter,
    statusFilter,
    categoryFilter,
    
    isUploadModalOpen,
    isDetailModalOpen,
    selectedDocument,
    viewOnlyMode,
    
    setTitleFilter,
    setStatusFilter,
    setCategoryFilter,
    setSelectedDocuments,
    
    selectDocument,
    selectAllDocuments,
    viewDocument,
    editDocument,
    deleteDocument,
    reindexDocument,
    uploadDocument,
    bulkUpload,
    saveDocument,
    
    reindexSelectedDocuments,
    reindexAllDocuments,
    deleteSelectedDocuments,
    
    openUploadModal,
    closeUploadModal,
    closeDetailModal,
    
    resetFilters
  };

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
};

// Hook für den einfachen Zugriff auf den Kontext
export const useDocuments = () => {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error("useDocuments muss innerhalb eines DocumentsProvider verwendet werden");
  }
  return context;
}; 