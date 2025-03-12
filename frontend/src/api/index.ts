// API-Core Exports
export * from './core';

// Api-Clients Exports
export * from './tenants';
export * from './documents';
export * from './chat';
export * from './interactive';
export * from './agencies';
export * from './users';

// Kombinierter API-Client
import { apiCore } from './core';
import { tenantApi } from './tenants';
import { documentApi } from './documents';
import { chatApi } from './chat';
import { interactiveApi, uiComponentsApi } from './interactive';
import { agencyApi } from './agencies';
import { userApi } from './users';

// Main API Client, der alle Module kombiniert
export const api = {
  // Core-Funktionen
  setApiKey: apiCore.setApiKey.bind(apiCore),
  getApiKey: apiCore.getApiKey.bind(apiCore),
  clearApiKey: apiCore.clearApiKey.bind(apiCore),
  
  // Tenant-Funktionen
  createTenant: tenantApi.createTenant.bind(tenantApi),
  getTenant: tenantApi.getTenant.bind(tenantApi),
  getAllTenants: tenantApi.getAllTenants.bind(tenantApi),
  updateTenant: tenantApi.updateTenant.bind(tenantApi),
  deleteTenant: tenantApi.deleteTenant.bind(tenantApi),
  getWeaviateStatus: tenantApi.getWeaviateStatus.bind(tenantApi),
  getEmbedConfig: tenantApi.getEmbedConfig.bind(tenantApi),
  getTenantDetails: tenantApi.getTenantDetails.bind(tenantApi),
  
  // Dokument-Funktionen
  createDocument: documentApi.createDocument.bind(documentApi),
  getDocument: documentApi.getDocument.bind(documentApi),
  getDocuments: documentApi.getDocuments.bind(documentApi),
  updateDocument: documentApi.updateDocument.bind(documentApi),
  deleteDocument: documentApi.deleteDocument.bind(documentApi),
  uploadCsv: documentApi.uploadCsv.bind(documentApi),
  uploadJson: documentApi.uploadJson.bind(documentApi),
  uploadMarkdown: documentApi.uploadMarkdown.bind(documentApi),
  uploadPdf: documentApi.uploadPdf.bind(documentApi),
  getDocumentStatus: documentApi.getDocumentStatus.bind(documentApi),
  reindexDocument: documentApi.reindexDocument.bind(documentApi),
  reindexAllDocuments: documentApi.reindexAllDocuments.bind(documentApi),
  
  // Chat-Funktionen
  search: chatApi.search.bind(chatApi),
  getCompletion: chatApi.getCompletion.bind(chatApi),
  getCompletionStream: chatApi.getCompletionStream.bind(chatApi),
  
  // Interaktive Elemente
  getInteractiveConfig: interactiveApi.getInteractiveConfig.bind(interactiveApi),
  updateInteractiveConfig: interactiveApi.updateInteractiveConfig.bind(interactiveApi),
  createInteractiveElement: interactiveApi.createInteractiveElement.bind(interactiveApi),
  updateInteractiveElement: interactiveApi.updateInteractiveElement.bind(interactiveApi),
  deleteInteractiveElement: interactiveApi.deleteInteractiveElement.bind(interactiveApi),
  
  // UI-Komponenten
  getUIComponentsConfig: uiComponentsApi.getUIComponentsConfig.bind(uiComponentsApi),
  saveUIComponentsConfig: uiComponentsApi.saveUIComponentsConfig.bind(uiComponentsApi),
  
  // UI-Komponenten-Definitionen
  getUIComponentDefinitions: uiComponentsApi.getUIComponentDefinitions.bind(uiComponentsApi),
  createUIComponentDefinition: uiComponentsApi.createUIComponentDefinition.bind(uiComponentsApi),
  updateUIComponentDefinition: uiComponentsApi.updateUIComponentDefinition.bind(uiComponentsApi),
  deleteUIComponentDefinition: uiComponentsApi.deleteUIComponentDefinition.bind(uiComponentsApi),
  
  // Agentur-Funktionen
  createAgency: agencyApi.createAgency.bind(agencyApi),
  getAgency: agencyApi.getAgency.bind(agencyApi),
  getAllAgencies: agencyApi.getAllAgencies.bind(agencyApi),
  updateAgency: agencyApi.updateAgency.bind(agencyApi),
  deleteAgency: agencyApi.deleteAgency.bind(agencyApi),
  assignTenantToAgency: agencyApi.assignTenantToAgency.bind(agencyApi),
  removeTenantFromAgency: agencyApi.removeTenantFromAgency.bind(agencyApi),
  
  // Benutzer-Funktionen
  createUser: userApi.createUser.bind(userApi),
  getUser: userApi.getUser.bind(userApi),
  getCurrentUser: userApi.getCurrentUser.bind(userApi),
  getAllUsers: userApi.getAllUsers.bind(userApi),
  updateUser: userApi.updateUser.bind(userApi),
  deleteUser: userApi.deleteUser.bind(userApi),
  assignTenantToUser: userApi.assignTenantToUser.bind(userApi),
  removeTenantFromUser: userApi.removeTenantFromUser.bind(userApi),
  assignUserToAgency: userApi.assignUserToAgency.bind(userApi),
  removeUserFromAgency: userApi.removeUserFromAgency.bind(userApi),
};

export default api; 