import { apiCore, API_BASE_URL } from './core';
import { Tenant, TenantCreate, TenantUpdate, TenantExtended } from '../types/api';

export class TenantApi {
  // --- Tenant-Endpunkte ---

  async createTenant(data: TenantCreate): Promise<Tenant> {
    const adminApiKey = "admin-secret-key-12345";
    
    try {
      // Direkter Fetch mit Admin-API-Key statt axios
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const newTenant = await response.json();
      
      // Automatisch Standard-UI-Komponenten für den neuen Tenant erstellen
      try {
        // Standard-Prompt und -Regeln aus der Konstanten-Datei importieren
        const { DEFAULT_BASE_PROMPT, DEFAULT_RULES } = await import('../components/ui-components-editor/shared/constants');
        
        // UI-Komponenten-Konfiguration speichern
        await fetch(`${API_BASE_URL}/tenants/${newTenant.id}/ui-components`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': adminApiKey
          },
          body: JSON.stringify({
            prompt: DEFAULT_BASE_PROMPT,
            rules: DEFAULT_RULES
          })
        });
        
        console.log('Standard-UI-Komponenten für neuen Tenant erstellt:', newTenant.id);
      } catch (err) {
        // Fehler beim Erstellen der UI-Komponenten sollten nicht das Erstellen des Tenants verhindern
        console.error('Fehler beim Erstellen der Standard-UI-Komponenten:', err);
      }
      
      return newTenant;
    } catch (error) {
      console.error("Fehler beim Erstellen eines Tenants:", error);
      throw error;
    }
  }

  async getTenant(id: string): Promise<Tenant> {
    console.log(`getTenant - Requesting tenant with ID: ${id}`);
    
    try {
      // Direkte fetch-Implementierung statt axios
      const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': apiCore.getApiKey() || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const rawData = await response.json();
      console.log("getTenant - Raw response data:", JSON.stringify(rawData));
      
      // Stelle sicher, dass is_brandenburg ein Boolean ist
      const tenant: Tenant = {
        ...rawData,
        is_brandenburg: rawData.hasOwnProperty('is_brandenburg') ? rawData.is_brandenburg === true : false
      };
      
      console.log("getTenant - Processed tenant:", JSON.stringify(tenant));
      console.log("getTenant - is_brandenburg value:", tenant.is_brandenburg);
      console.log("getTenant - is_brandenburg type:", typeof tenant.is_brandenburg);
      
      return tenant;
    } catch (error) {
      console.error("Fehler beim Abrufen des Tenants:", error);
      throw error;
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    const adminApiKey = "admin-secret-key-12345";
    
    try {
      const response = await fetch(`${API_BASE_URL}/tenants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey,
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const rawData = await response.json();
      console.log("getAllTenants - Raw response data:", JSON.stringify(rawData));
      
      // Stelle sicher, dass alle Tenants ein is_brandenburg-Feld haben
      const processedTenants: Tenant[] = rawData.map((tenant: any) => ({
        ...tenant,
        is_brandenburg: tenant.hasOwnProperty('is_brandenburg') ? tenant.is_brandenburg === true : false
      }));
      
      console.log("getAllTenants - Processed tenants:", JSON.stringify(processedTenants));
      return processedTenants;
    } catch (error) {
      console.error("Fehler beim Abrufen aller Tenants:", error);
      throw error;
    }
  }

  async updateTenant(id: string, data: TenantUpdate): Promise<Tenant> {
    console.log("API updateTenant - Raw data received:", JSON.stringify(data));
    
    // Stelle sicher, dass bool'sche Werte richtig behandelt werden
    const sanitizedData = { ...data };
    
    // Explizit testen und konvertieren
    if ('is_brandenburg' in sanitizedData) {
      const boolValue = sanitizedData.is_brandenburg === true;
      console.log(`Converting is_brandenburg from ${sanitizedData.is_brandenburg} (${typeof sanitizedData.is_brandenburg}) to ${boolValue}`);
      sanitizedData.is_brandenburg = boolValue;
    }
    
    if ('use_mistral' in sanitizedData) {
      const boolValue = sanitizedData.use_mistral === true;
      console.log(`Converting use_mistral from ${sanitizedData.use_mistral} (${typeof sanitizedData.use_mistral}) to ${boolValue}`);
      sanitizedData.use_mistral = boolValue;
    }
    
    console.log("API updateTenant - Sanitized data to send:", JSON.stringify(sanitizedData));
    const response = await apiCore.getClient().put(`/tenants/${id}`, sanitizedData);
    console.log("API updateTenant - Response from backend:", response.data);
    
    // Validiere den zurückgegebenen Wert
    const tenant = response.data;
    console.log("is_brandenburg in response:", tenant.is_brandenburg, "(type:", typeof tenant.is_brandenburg, ")");
    
    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    const adminApiKey = "admin-secret-key-12345";
    
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${id}`, {
        method: 'DELETE',
        headers: {
          'X-API-Key': adminApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Fehler beim Löschen des Tenants:", error);
      throw error;
    }
  }

  // --- Admin-Endpunkte ---
  
  async getWeaviateStatus(): Promise<any> {
    const adminApiKey = "admin-secret-key-12345";
    
    try {
      const response = await fetch(`${API_BASE_URL}/admin/weaviate-status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen des Weaviate-Status:", error);
      return { status: 'error' };
    }
  }

  async getEmbedConfig(apiKey: string): Promise<any> {
    try {
      // Direkter Fetch mit API-Key statt axios
      const response = await fetch(`${API_BASE_URL}/embed/config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der Embed-Konfiguration:", error);
      throw error;
    }
  }

  // Erweiterte Details eines Tenants abrufen, inklusive Agentur und zugewiesenen Redakteuren
  async getTenantDetails(id: string): Promise<TenantExtended> {
    const adminApiKey = "admin-secret-key-12345";
    
    try {
      const response = await fetch(`${API_BASE_URL}/tenants/${id}/details`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': adminApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Fehler beim Abrufen der erweiterten Tenant-Details:", error);
      throw error;
    }
  }
}

// Singleton-Instanz
export const tenantApi = new TenantApi(); 