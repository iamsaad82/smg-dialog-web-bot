import { apiCore, API_BASE_URL, callApi } from './core';
import { Tenant, TenantCreate, TenantUpdate, TenantExtended } from '../types/api';

// Standard-API-Key für Admin-Operationen
const ADMIN_API_KEY = "admin-secret-key-12345";

export class TenantApi {
  // --- Tenant-Endpunkte ---

  async createTenant(tenant: TenantCreate): Promise<Tenant> {
    try {
      const newTenant = await callApi<Tenant>('/v1/tenants', {
        method: 'POST',
        body: tenant,
        apiKey: ADMIN_API_KEY
      });

      // Automatisch Standard-UI-Komponenten für den neuen Tenant erstellen
      try {
        // Standard-Prompt und -Regeln aus der Konstanten-Datei importieren
        const { DEFAULT_BASE_PROMPT, DEFAULT_RULES } = await import('../components/ui-components-editor/shared/constants');
        
        // UI-Komponenten-Konfiguration speichern
        console.log('Creating UI components for new tenant');
        await callApi(`/v1/tenants/${newTenant.id}/ui-components`, {
          method: 'POST',
          body: {
            prompt: DEFAULT_BASE_PROMPT,
            rules: DEFAULT_RULES
          },
          apiKey: ADMIN_API_KEY
        });
        
        console.log('Standard-UI-Komponenten für neuen Tenant erstellt:', newTenant.id);
      } catch (err) {
        // Fehler beim Erstellen der UI-Komponenten sollten nicht das Erstellen des Tenants verhindern
        console.error('Fehler beim Erstellen der Standard-UI-Komponenten:', err);
      }

      return newTenant;
    } catch (error) {
      console.error('Fehler beim Erstellen des Tenants:', error);
      throw error;
    }
  }

  async getTenant(id: string): Promise<Tenant> {
    console.log('Getting tenant with unified API approach');
    
    try {
      const rawData = await callApi<any>(`/v1/tenants/${id}`, {
        apiKey: ADMIN_API_KEY
      });
      
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
    } catch (error) {
      console.error("Fehler beim Abrufen des Tenants:", error);
      throw error;
    }
  }

  async getAllTenants(): Promise<Tenant[]> {
    console.log('Getting all tenants with unified API approach');
    
    try {
      const rawTenants = await callApi<any[]>('/v1/tenants', {
        apiKey: ADMIN_API_KEY
      });
      
      // Stelle sicher, dass alle Tenants die richtigen Felder haben
      const tenants: Tenant[] = rawTenants.map((tenant: any) => ({
        ...tenant,
        use_mistral: tenant.hasOwnProperty('use_mistral') ? tenant.use_mistral === true : false,
        renderer_type: tenant.renderer_type || 'default',
        config: tenant.config || {}
      }));
      
      return tenants;
    } catch (error) {
      console.error('Fehler beim Abrufen der Tenants:', error);
      throw error;
    }
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
    
    try {
      const tenant = await callApi<Tenant>(`/v1/tenants/${id}`, {
        method: 'PUT',
        body: sanitizedData,
        apiKey: ADMIN_API_KEY
      });
      
      console.log("renderer_type in response:", tenant.renderer_type);
      console.log("config in response:", tenant.config);
      
      return tenant;
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Tenants:", error);
      throw error;
    }
  }

  async deleteTenant(id: string): Promise<void> {
    try {
      console.log('Deleting tenant with unified API approach');
      
      await callApi(`/v1/tenants/${id}`, {
        method: 'DELETE',
        apiKey: ADMIN_API_KEY
      });
    } catch (error) {
      console.error("Fehler beim Löschen des Tenants:", error);
      throw error;
    }
  }

  // --- Admin-Endpunkte ---
  
  async getWeaviateStatus(): Promise<any> {
    try {
      console.log('Getting Weaviate status with unified API approach');
      
      return await callApi('/v1/admin/weaviate-status', {
        apiKey: ADMIN_API_KEY
      });
    } catch (error) {
      console.error("Fehler beim Abrufen des Weaviate-Status:", error);
      return { status: 'error' };
    }
  }

  async getEmbedConfig(apiKey: string): Promise<any> {
    try {
      console.log('Getting embed config with unified API approach');
      
      return await callApi('/v1/embed/config', {
        apiKey
      });
    } catch (error) {
      console.error("Fehler beim Abrufen der Embed-Konfiguration:", error);
      throw error;
    }
  }

  // Erweiterte Details eines Tenants abrufen, inklusive Agentur und zugewiesenen Redakteuren
  async getTenantDetails(id: string): Promise<TenantExtended> {
    try {
      console.log('Getting tenant details with unified API approach');
      
      return await callApi(`/v1/tenants/${id}/details`, {
        apiKey: ADMIN_API_KEY
      });
    } catch (error) {
      console.error("Fehler beim Abrufen der erweiterten Tenant-Details:", error);
      throw error;
    }
  }
}

// Singleton-Instanz
export const tenantApi = new TenantApi();
