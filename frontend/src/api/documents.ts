import { apiCore, callApi } from './core';
import { Document, DocumentCreate, IndexStatus } from '../types/api';
import axios from 'axios';

export class DocumentApi {
  // --- Dokument-Endpunkte ---

  async createDocument(data: DocumentCreate): Promise<Document> {
    // DIREKT /api/v1 verwenden, nicht erst /v1
    const url = `/api/v1/documents`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json() as Document;
  }

  async getDocuments(tenantId: string, limit = 1000, offset = 0): Promise<Document[]> {
    try {
      if (!apiCore.getApiKey()) {
        throw new Error('API-Key ist nicht gesetzt');
      }

      console.log('Starte Dokument-Anfrage mit callApi');
      console.log('Mit API-Key:', apiCore.getApiKey());
      console.log('Für Tenant:', tenantId);
      
      // Der Endpunkt erwartet tenant_id als Query-Parameter
      // DIREKT /api/v1 verwenden, nicht erst /v1
      // WICHTIG: Keine Trailing-Slashes verwenden, die zu Redirects führen könnten
      const url = `/api/v1/documents?tenant_id=${encodeURIComponent(tenantId)}`;
      console.log('Verwende URL:', url);
      
      // Die callApi-Funktion würde normalerweise /api/v1 hinzufügen, was hier doppelt wäre
      // Daher verwenden wir fetch direkt mit spezifischen Optionen, die Redirects erlauben
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': apiCore.getApiKey() || '',
          'Content-Type': 'application/json'
        },
        // Weiterleitungen erlauben
        redirect: 'follow',
        // Wichtig: Nur Anfragen an die gleiche Herkunft zulassen
        mode: 'same-origin',
        // Wichtig: Credentials nur für gleiche Herkunft senden
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json() as Document[];
    } catch (error) {
      console.error("Fehler beim Abrufen der Dokumente:", error);
      throw error;
    }
  }

  async getDocument(tenantId: string, documentId: string): Promise<Document> {
    // DIREKT /api/v1 verwenden, nicht erst /v1
    const url = `/api/v1/documents/${documentId}?tenant_id=${encodeURIComponent(tenantId)}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json() as Document;
  }

  async deleteDocument(tenantId: string, documentId: string): Promise<void> {
    // DIREKT /api/v1 verwenden, nicht erst /v1
    const url = `/api/v1/documents/${documentId}?tenant_id=${encodeURIComponent(tenantId)}`;
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
        'Content-Type': 'application/json'
      },
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return;
  }

  async uploadCsv(tenantId: string, file: File, titleColumn = 'title', contentColumn = 'content', sourceColumn?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title_column', titleColumn);
    formData.append('content_column', contentColumn);
    formData.append('tenant_id', tenantId);
    if (sourceColumn) {
      formData.append('source_column', sourceColumn);
    }

    // FormData muss mit fetch gesendet werden, da callApi es nicht nativ unterstützt
    const response = await fetch(`/api/v1/documents/upload/csv`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
      },
      body: formData,
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  }

  async uploadJson(tenantId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);

    // FormData muss mit fetch gesendet werden
    const response = await fetch(`/api/v1/documents/upload/json`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
      },
      body: formData,
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  }

  async uploadMarkdown(tenantId: string, file: File, source?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);
    
    if (source) {
      formData.append('source', source);
    }

    // FormData muss mit fetch gesendet werden
    const response = await fetch(`/api/v1/documents/upload/markdown`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
      },
      body: formData,
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
  }

  async uploadPdf(tenantId: string, file: File, source?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tenant_id', tenantId);
    
    if (source) {
      formData.append('source', source);
    }

    // FormData muss mit fetch gesendet werden
    const response = await fetch(`/api/v1/documents/upload/pdf`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
      },
      body: formData,
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
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
      // DIREKT /api/v1 verwenden, nicht erst /v1
      const url = `/api/v1/documents/${documentId}/status?tenant_id=${encodeURIComponent(tenantId)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': apiCore.getApiKey() || '',
          'Content-Type': 'application/json'
        },
        redirect: 'follow',
        mode: 'same-origin',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json() as {status: IndexStatus};

      console.log(`Document status retrieved successfully: ${JSON.stringify(data)}`);
      return { status: data.status };
    } catch (error) {
      console.error('Error retrieving document status:', error);
      return { 
        status: IndexStatus.NICHT_INDIZIERT, 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
      };
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

      // Zuerst das Dokument abrufen, um die vollständigen Daten zu haben
      const document = await this.getDocument(tenantId, documentId);
      
      // DIREKT /api/v1 verwenden, nicht erst /v1
      const url = `/api/v1/documents/${documentId}/reindex?tenant_id=${encodeURIComponent(tenantId)}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': apiCore.getApiKey() || '',
          'Content-Type': 'application/json'
        },
        redirect: 'follow',
        mode: 'same-origin',
        credentials: 'same-origin',
        body: JSON.stringify(document) // Dokumentdaten im Request-Body senden
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Reindexierung fehlgeschlagen:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Dokument konnte nicht reindexiert werden: ${errorMessage}`);
    }
  }
  
  // Alle Dokumente eines Tenants neu indizieren
  async reindexAllDocuments(tenantId: string): Promise<any> {
    try {
      // DIREKT /api/v1 verwenden, nicht erst /v1
      const url = `/api/v1/documents/reindex-all?tenant_id=${encodeURIComponent(tenantId)}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'X-API-Key': apiCore.getApiKey() || '',
          'Content-Type': 'application/json'
        },
        redirect: 'follow',
        mode: 'same-origin',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Wir prüfen den Status der Indizierung im Hintergrund und geben eine sofortige Antwort
      this.pollBulkIndexingStatus(tenantId);
      
      return {
        success: true,
        message: "Indizierung aller Dokumente gestartet",
        ...result
      };
    } catch (error: any) {
      console.error(`Fehler beim Indizieren aller Dokumente für Tenant ${tenantId}:`, error);
      
      // Bei Serverfehlern noch einmal versuchen
      if (error.status >= 500) {
        console.log("Serverfehler beim Massenindizieren, versuche erneut in 5 Sekunden...");
        
        return new Promise((resolve, reject) => {
          setTimeout(async () => {
            try {
              // DIREKT /api/v1 verwenden, nicht erst /v1
              const url = `/api/v1/documents/reindex-all?tenant_id=${encodeURIComponent(tenantId)}`;
              
              const response = await fetch(url, {
                method: 'POST',
                headers: {
                  'X-API-Key': apiCore.getApiKey() || '',
                  'Content-Type': 'application/json'
                },
                redirect: 'follow',
                mode: 'same-origin',
                credentials: 'same-origin'
              });
              
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              
              const retryResult = await response.json();
              
              console.log("Wiederholungsversuch der Massenindizierung erfolgreich");
              
              // Polling im Hintergrund starten
              this.pollBulkIndexingStatus(tenantId);
              
              resolve({
                success: true,
                message: "Indizierung aller Dokumente gestartet (nach Wiederholung)",
                ...retryResult
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
        message: error.data?.message || "Ein unbekannter Fehler ist aufgetreten."
      };
    }
  }
  
  // Hintergrund-Polling für Massenindizierung
  private async pollBulkIndexingStatus(tenantId: string, interval = 5000, maxAttempts = 60): Promise<void> {
    let attempts = 0;
    
    const checkStatus = async () => {
      try {
        // DIREKT /api/v1 verwenden, nicht erst /v1
        const url = `/api/v1/documents/indexing-status?tenant_id=${encodeURIComponent(tenantId)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-Key': apiCore.getApiKey() || '',
            'Content-Type': 'application/json'
          },
          redirect: 'follow',
          mode: 'same-origin',
          credentials: 'same-origin'
        });
        
        if (!response.ok) {
          console.error(`HTTP error bei Abruf des Indizierungsstatus! Status: ${response.status}`);
          return;
        }
        
        const status = await response.json();
        
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
    // DIREKT /api/v1 verwenden, nicht erst /v1
    const url = `/api/v1/documents/${documentId}?tenant_id=${encodeURIComponent(tenantId)}`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'X-API-Key': apiCore.getApiKey() || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      redirect: 'follow',
      mode: 'same-origin',
      credentials: 'same-origin'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  }

  // Weaviate-Status eines Dokuments abrufen (alte Methode)
  async getDocumentWeaviateStatus(tenantId: string, documentId: string): Promise<any> {
    // Delegieren an die neue Methode
    return this.getWeaviateStatus(tenantId, documentId);
  }

  // Weaviate-Status eines Dokuments abrufen
  async getWeaviateStatus(tenantId: string, documentId: string): Promise<any> {
    console.log(`API: Rufe Weaviate-Status für Dokument ${documentId} von Tenant ${tenantId} ab`);
    try {
      if (!tenantId || !documentId) {
        console.error('Weaviate-Status-Abruf fehlgeschlagen: Tenant-ID oder Dokument-ID fehlt');
        throw new Error('Tenant-ID und Dokument-ID müssen angegeben werden');
      }

      // DIREKT /api/v1 verwenden, nicht erst /v1
      const url = `/api/v1/documents/${documentId}/weaviate-status?tenant_id=${encodeURIComponent(tenantId)}`;
      
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'X-API-Key': apiCore.getApiKey() || '',
            'Content-Type': 'application/json'
          },
          redirect: 'follow',
          mode: 'same-origin',
          credentials: 'same-origin'
        });
        
        if (!response.ok) {
          // Wenn der Backend-Endpunkt fehlschlägt, liefern wir einen Status zurück, der anzeigt,
          // dass wir den Status nicht abrufen konnten, aber die UI kann weiterlaufen
          console.warn(`Weaviate-Status konnte nicht abgerufen werden: HTTP Status ${response.status}`);
          return {
            status: 'unknown',
            error: `Konnte Status nicht abrufen: HTTP Status ${response.status}`
          };
        }
        
        return await response.json();
      } catch (fetchError) {
        // Bei Netzwerkfehler oder anderen Problemen
        console.warn('Netzwerkfehler beim Abrufen des Weaviate-Status:', fetchError);
        return {
          status: 'unknown',
          error: 'Netzwerkfehler beim Abrufen des Status'
        };
      }
    } catch (error) {
      console.error('Weaviate-Status-Abruf fehlgeschlagen:', error);
      // Fallback-Status zurückgeben, damit die UI nicht abstürzt
      return {
        status: 'unknown',
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Abrufen des Status'
      };
    }
  }
}

// Singleton-Instanz
export const documentApi = new DocumentApi(); 