import { apiCore } from './core';
import { Document, DocumentCreate, IndexStatus } from '../types/api';
import axios from 'axios';

export class DocumentApi {
  // --- Dokument-Endpunkte ---

  async createDocument(data: DocumentCreate): Promise<Document> {
    const response = await apiCore.getClient().post('/documents', data);
    return response.data;
  }

  async getDocuments(tenantId: string, limit = 1000, offset = 0): Promise<Document[]> {
    try {
      if (!apiCore.getApiKey()) {
        throw new Error('API-Key ist nicht gesetzt');
      }

      console.log('Sende Dokument-Anfrage mit Axios');
      console.log('Mit API-Key:', apiCore.getApiKey());
      
      const response = await apiCore.getClient().get(`/tenants/${tenantId}/documents`, {
        params: {
          limit,
          offset
        }
      });
      
      console.log('Server-Antwort:', response.data);
      return response.data;
    } catch (error) {
      console.error("Fehler beim Abrufen der Dokumente:", error);
      throw error;
    }
  }

  async getDocument(tenantId: string, documentId: string): Promise<Document> {
    const response = await apiCore.getClient().get(`/tenants/${tenantId}/documents/${documentId}`);
    return response.data;
  }

  async deleteDocument(tenantId: string, documentId: string): Promise<void> {
    await apiCore.getClient().delete(`/tenants/${tenantId}/documents/${documentId}`);
  }

  async uploadCsv(tenantId: string, file: File, titleColumn = 'title', contentColumn = 'content', sourceColumn?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title_column', titleColumn);
    formData.append('content_column', contentColumn);
    if (sourceColumn) {
      formData.append('source_column', sourceColumn);
    }

    const response = await apiCore.getClient().post(`/tenants/${tenantId}/documents/upload/csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadJson(tenantId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiCore.getClient().post(`/tenants/${tenantId}/documents/upload/json`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadMarkdown(tenantId: string, file: File, source?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (source) {
      formData.append('source', source);
    }

    const response = await apiCore.getClient().post(`/tenants/${tenantId}/documents/upload/markdown`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadPdf(tenantId: string, file: File, source?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (source) {
      formData.append('source', source);
    }

    const response = await apiCore.getClient().post(`/tenants/${tenantId}/documents/upload/pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // --- Dokument-Status und Indizierung ---

  // Dokument-Status abrufen
  async getDocumentStatus(tenantId: string, documentId: string): Promise<{ status: IndexStatus; error?: string }> {
    console.log(`Retrieving document status for document ${documentId} in tenant ${tenantId}`);
    
    if (!tenantId) {
      console.error('getDocumentStatus: tenantId is required');
      return { status: IndexStatus.NICHT_INDIZIERT, error: 'Tenant-ID fehlt' };
    }
    
    if (!documentId) {
      console.error('getDocumentStatus: documentId is required');
      return { status: IndexStatus.NICHT_INDIZIERT, error: 'Dokument-ID fehlt' };
    }

    try {
      const response = await apiCore.getClient().get(
        `/tenants/${tenantId}/documents/${documentId}/status`
      );

      if (response.status >= 200 && response.status < 300) {
        console.log(`Document status retrieved successfully: ${JSON.stringify(response.data)}`);
        return { status: response.data.status };
      } else {
        console.warn(`Unexpected status code: ${response.status}`);
        return { 
          status: IndexStatus.NICHT_INDIZIERT, 
          error: `Unerwarteter Statuscode: ${response.status}` 
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Der Server hat mit einem Statuscode außerhalb des 2xx-Bereichs geantwortet
          if (error.response.status === 404) {
            console.warn(`Document ${documentId} not found in tenant ${tenantId}`);
            return { 
              status: IndexStatus.NICHT_INDIZIERT, 
              error: 'Dokument nicht gefunden' 
            };
          } else if (error.response.status === 500) {
            console.warn(`Backend error when retrieving status for document ${documentId}`);
            return { 
              status: IndexStatus.NICHT_INDIZIERT, 
              error: 'Backend-Fehler: Interner Serverfehler' 
            };
          } else {
            console.error(`Error retrieving document status: ${error.response.status} - ${error.response.statusText}`);
            return { 
              status: IndexStatus.NICHT_INDIZIERT, 
              error: `API-Fehler: ${error.response.status} ${error.response.statusText}` 
            };
          }
        } else if (error.request) {
          // Die Anfrage wurde gestellt, aber es gab keine Antwort
          console.error('Error retrieving document status: No response received');
          return { 
            status: IndexStatus.NICHT_INDIZIERT, 
            error: 'Netzwerkfehler: Keine Antwort vom Server' 
          };
        } else {
          // Beim Einrichten der Anfrage ist ein Fehler aufgetreten
          console.error(`Error retrieving document status: ${error.message}`);
          return { 
            status: IndexStatus.NICHT_INDIZIERT, 
            error: `Anfragefehler: ${error.message}` 
          };
        }
      } else {
        // Nicht-Axios-Fehler
        console.error(`Unexpected error retrieving document status: ${error}`);
        return { 
          status: IndexStatus.NICHT_INDIZIERT, 
          error: `Unerwarteter Fehler: ${error}` 
        };
      }
    }
  }
  
  // Ein einzelnes Dokument neu indizieren
  async reindexDocument(tenantId: string, documentId: string): Promise<any> {
    console.log(`API: Starte Reindexierung für Dokument ${documentId} von Tenant ${tenantId}`);
    try {
      if (!tenantId || !documentId) {
        console.error('Reindexierung fehlgeschlagen: Tenant-ID oder Dokument-ID fehlt');
        throw new Error('Tenant-ID und Dokument-ID müssen angegeben werden');
      }

      const response = await apiCore.getClient().post(
        `/tenants/${tenantId}/documents/${documentId}/reindex`
      );
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`API: Reindexierung erfolgreich für Dokument ${documentId}`);
        return response.data;
      } else {
        console.error(`API: Unerwarteter Status bei Reindexierung: ${response.status}`);
        throw new Error(`Fehler beim Reindexieren: HTTP-Status ${response.status}`);
      }
    } catch (error) {
      console.error('Reindexierung fehlgeschlagen:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Dokument konnte nicht reindexiert werden: ${errorMessage}`);
    }
  }
  
  // Alle Dokumente eines Tenants neu indizieren
  async reindexAllDocuments(tenantId: string): Promise<any> {
    try {
      const response = await apiCore.getClient().post(`/tenants/${tenantId}/documents/reindex-all`);
      
      // Wir prüfen den Status der Indizierung im Hintergrund und geben eine sofortige Antwort
      this.pollBulkIndexingStatus(tenantId);
      
      return {
        success: true,
        message: "Indizierung aller Dokumente gestartet",
        ...response.data
      };
    } catch (error: any) {
      console.error(`Fehler beim Indizieren aller Dokumente für Tenant ${tenantId}:`, error);
      
      // Bei Serverfehlern noch einmal versuchen
      if (error.response && error.response.status >= 500) {
        console.log("Serverfehler beim Massenindizieren, versuche erneut in 5 Sekunden...");
        
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              const retryResponse = await apiCore.getClient().post(
                `/tenants/${tenantId}/documents/reindex-all`
              );
              console.log("Wiederholungsversuch der Massenindizierung erfolgreich");
              
              // Polling im Hintergrund starten
              this.pollBulkIndexingStatus(tenantId);
              
              resolve({
                success: true,
                message: "Indizierung aller Dokumente gestartet (nach Wiederholung)",
                ...retryResponse.data
              });
            } catch (retryError) {
              console.error("Auch der Wiederholungsversuch der Massenindizierung ist fehlgeschlagen:", retryError);
              reject({
                error: "Massenindizierung fehlgeschlagen",
                details: retryError,
                message: "Die Dokumente konnten nicht indiziert werden. Bitte prüfen Sie die Serverprotokolle."
              });
            }
          }, 5000);
        });
      }
      
      throw {
        error: "Massenindizierung fehlgeschlagen",
        details: error,
        message: error.response?.data?.message || "Ein unbekannter Fehler ist aufgetreten."
      };
    }
  }
  
  // Hintergrund-Polling für Massenindizierung
  private async pollBulkIndexingStatus(tenantId: string, interval = 5000, maxAttempts = 60): Promise<void> {
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        // Endpunkt für den Indexierungsstatus abrufen
        const response = await apiCore.getClient().get(`/tenants/${tenantId}/indexing-status`);
        const status = response.data;
        
        console.log(`Indizierungsstatus für Tenant ${tenantId}:`, status);
        
        // Prüfen, ob die Indizierung abgeschlossen ist
        if (status.completed || attempts >= maxAttempts) {
          console.log("Indizierung abgeschlossen oder maximale Versuche erreicht");
          return;
        }
        
        // Weiter pollen
        attempts++;
        setTimeout(checkStatus, interval);
      } catch (error) {
        console.error("Fehler beim Abrufen des Indizierungsstatus:", error);
        
        // Bei Fehlern weiter versuchen, aber nicht endlos
        if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, interval);
        }
      }
    };
    
    // Polling starten
    checkStatus();
  }
  
  async updateDocument(tenantId: string, documentId: string, data: any): Promise<any> {
    const response = await apiCore.getClient().put(`/tenants/${tenantId}/documents/${documentId}`, data);
    return response.data;
  }

  // Weaviate-Status eines Dokuments abrufen
  async getWeaviateStatus(tenantId: string, documentId: string): Promise<any> {
    console.log(`API: Rufe Weaviate-Status für Dokument ${documentId} von Tenant ${tenantId} ab`);
    try {
      if (!tenantId || !documentId) {
        console.error('Weaviate-Status-Abruf fehlgeschlagen: Tenant-ID oder Dokument-ID fehlt');
        throw new Error('Tenant-ID und Dokument-ID müssen angegeben werden');
      }

      const response = await apiCore.getClient().get(
        `/tenants/${tenantId}/documents/${documentId}/weaviate-status`
      );
      
      if (response.status >= 200 && response.status < 300) {
        console.log(`API: Weaviate-Status-Abruf erfolgreich für Dokument ${documentId}:`, response.data);
        return response.data;
      } else {
        console.error(`API: Unerwarteter Status bei Weaviate-Status-Abruf: ${response.status}`);
        throw new Error(`Fehler beim Abrufen des Weaviate-Status: HTTP-Status ${response.status}`);
      }
    } catch (error) {
      console.error('Weaviate-Status-Abruf fehlgeschlagen:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Weaviate-Dokumentstatus konnte nicht abgerufen werden: ${errorMessage}`);
    }
  }
}

// Singleton-Instanz
export const documentApi = new DocumentApi(); 