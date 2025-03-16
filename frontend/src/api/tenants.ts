import { apiCore, API_BASE_URL } from './core';
import { Tenant, TenantCreate, TenantUpdate, TenantExtended } from '../types/api';

export class TenantApi {
  // --- Tenant-Endpunkte ---

  async createTenant(data: TenantCreate): Promise<Tenant> {
    const adminApiKey = "admin-secret-key-12345";
    
    try {
      // Direkter Fetch mit Admin-API-Key statt axios
      const response = await fetch(`http://localhost:8000/api/v1/tenants`, {
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
        await fetch(`http://localhost:8000/api/v1/tenants/${newTenant.id}/ui-components`, {
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
    const adminApiKey = "admin-secret-key-12345";
    
    // Direct fetch to backend
    const response = await fetch(`http://localhost:8000/api/v1/tenants/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': adminApiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen des Tenants: ${response.statusText}`);
    }
    const rawData = await response.json();
    
    // Daten konvertieren und validieren
    const tenant: Tenant = {
      ...rawData,
      use_mistral: rawData.hasOwnProperty('use_mistral') ? rawData.use_mistral === true : false,
      renderer_type: rawData.renderer_type || 'default',
      config: rawData.config || {}
    };
    
    console.log("getTenant - renderer_type value:", tenant.renderer_type);
    console.log("getTenant - config:", tenant.config);
    
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    const adminApiKey = "admin-secret-key-12345";
    
    // Direct fetch to backend
    const response = await fetch(`http://localhost:8000/api/v1/tenants/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': adminApiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`Fehler beim Abrufen der Tenants: ${response.statusText}`);
    }
    const rawTenants = await response.json();
    
    // Stelle sicher, dass alle Tenants die richtigen Felder haben
    const tenants: Tenant[] = rawTenants.map((tenant: any) => ({
      ...tenant,
      use_mistral: tenant.hasOwnProperty('use_mistral') ? tenant.use_mistral === true : false,
      renderer_type: tenant.renderer_type || 'default',
      config: tenant.config || {}
    }));
    
    return tenants;
  }

  async updateTenant(id: string, data: TenantUpdate): Promise<Tenant> {
    // Daten vor dem Senden bereinigen
    const sanitizedData = { ...data };
    
    // Boolean-Wert korrekt konvertieren
    if ('use_mistral' in sanitizedData) {
      const boolValue = sanitizedData.use_mistral === true;
      console.log(`Converting use_mistral from ${sanitizedData.use_mistral} (${typeof sanitizedData.use_mistral}) to ${boolValue}`);
      sanitizedData.use_mistral = boolValue;
    }
    
    console.log("updateTenant - renderer_type:", sanitizedData.renderer_type);
    console.log("updateTenant - config:", sanitizedData.config);
    
    const adminApiKey = "admin-secret-key-12345";
    
    const response = await fetch(`http://localhost:8000/api/v1/tenants/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': adminApiKey
      },
      body: JSON.stringify(sanitizedData),
    });
    
    if (!response.ok) {
      throw new Error(`Fehler beim Aktualisieren des Tenants: ${response.statusText}`);
    }
    
    const tenant = await response.json();
    console.log("renderer_type in response:", tenant.renderer_type);
    console.log("config in response:", tenant.config);
    
    return tenant;
  }

  async deleteTenant(id: string): Promise<void> {
    const adminApiKey = "admin-secret-key-12345";
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/tenants/${id}`, {
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
      const response = await fetch(`http://localhost:8000/api/v1/admin/weaviate-status`, {
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
      const response = await fetch(`http://localhost:8000/api/v1/embed/config`, {
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
      const response = await fetch(`http://localhost:8000/api/v1/tenants/${id}/details`, {
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
