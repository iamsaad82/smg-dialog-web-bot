import { apiCore } from './core';
import { InteractiveConfig } from '../types/api';

interface ComponentRule {
  id: string;
  component: string;
  triggers: string[];
  isEnabled: boolean;
}

// Lokale Definition für UI-Komponenten
interface UIComponentsConfig {
  prompt: string;
  rules: ComponentRule[];
}

export class InteractiveApi {
  async getInteractiveConfig(tenantId: string): Promise<InteractiveConfig> {
    const response = await apiCore.getClient().get(`/tenants/${tenantId}/interactive`);
    return response.data;
  }

  async updateInteractiveConfig(tenantId: string, config: InteractiveConfig): Promise<InteractiveConfig> {
    const response = await apiCore.getClient().put(`/tenants/${tenantId}/interactive`, { interactive_config: config });
    return response.data;
  }

  async createInteractiveElement(tenantId: string, element: any): Promise<any> {
    // Implementierung folgt
    return {};
  }

  async updateInteractiveElement(tenantId: string, elementId: string, element: any): Promise<any> {
    // Implementierung folgt
    return {};
  }

  async deleteInteractiveElement(tenantId: string, elementId: string): Promise<void> {
    // Implementierung folgt
  }
}

export class UIComponentsApi {
  async getUIComponentsConfig(tenantId: string): Promise<UIComponentsConfig> {
    const response = await apiCore.getClient().get(`/tenants/${tenantId}/ui-components`);
    return response.data;
  }

  async saveUIComponentsConfig(tenantId: string, config: UIComponentsConfig): Promise<UIComponentsConfig> {
    const response = await apiCore.getClient().post(`/tenants/${tenantId}/ui-components`, config);
    return response.data;
  }

  // Neue Methoden für die UI-Komponenten-Definitionen
  async getUIComponentDefinitions(): Promise<any[]> {
    const response = await apiCore.getClient().get('/tenants/ui-components-definitions');
    return response.data;
  }

  async createUIComponentDefinition(definition: any): Promise<any> {
    const response = await apiCore.getClient().post('/tenants/ui-components-definitions', definition);
    return response.data;
  }

  async updateUIComponentDefinition(definitionId: string, definition: any): Promise<any> {
    const response = await apiCore.getClient().put(`/tenants/ui-components-definitions/${definitionId}`, definition);
    return response.data;
  }

  async deleteUIComponentDefinition(definitionId: string): Promise<void> {
    await apiCore.getClient().delete(`/tenants/ui-components-definitions/${definitionId}`);
  }
}

export const interactiveApi = new InteractiveApi();
export const uiComponentsApi = new UIComponentsApi(); 