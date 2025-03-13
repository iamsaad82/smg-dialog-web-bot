import { authApi } from './auth';
import { userApi } from './users';
import { apiCore } from './core';
import { tenantApi } from './tenants';
import { chatApi } from './chat';
import { DocumentApi } from './documents';
import { agencyApi } from './agencies';
import { InteractiveApi, UIComponentsApi } from './interactive';

// Instanzen der API-Klassen erstellen
const documentApi = new DocumentApi();
const interactiveApi = new InteractiveApi();
const uiComponentsApi = new UIComponentsApi();

// Kombinierte API-Schnittstelle
export const api = {
  // Core-Funktionen
  setApiKey: apiCore.setApiKey.bind(apiCore),
  getApiKey: apiCore.getApiKey.bind(apiCore),
  clearApiKey: apiCore.clearApiKey.bind(apiCore),
  
  // Auth-Funktionen
  login: authApi.login.bind(authApi),
  logout: authApi.logout.bind(authApi),
  getCurrentUser: authApi.getCurrentUser.bind(authApi),
  refreshToken: authApi.refreshToken.bind(authApi),
  requestPasswordReset: authApi.requestPasswordReset.bind(authApi),
  confirmPasswordReset: authApi.confirmPasswordReset.bind(authApi),
  
  // Benutzer-Funktionen
  createUser: userApi.createUser.bind(userApi),
  getUser: userApi.getUser.bind(userApi),
  getAllUsers: userApi.getAllUsers.bind(userApi),
  updateUser: userApi.updateUser.bind(userApi),
  deleteUser: userApi.deleteUser.bind(userApi),
  assignTenantToUser: userApi.assignTenantToUser.bind(userApi),
  removeTenantFromUser: userApi.removeTenantFromUser.bind(userApi),
  assignUserToAgency: userApi.assignUserToAgency.bind(userApi),
  removeUserFromAgency: userApi.removeUserFromAgency.bind(userApi),
  
  // Tenant-Funktionen
  createTenant: tenantApi.createTenant.bind(tenantApi),
  getTenant: tenantApi.getTenant.bind(tenantApi),
  getAllTenants: tenantApi.getAllTenants.bind(tenantApi),
  updateTenant: tenantApi.updateTenant.bind(tenantApi),
  deleteTenant: tenantApi.deleteTenant.bind(tenantApi),
  getTenantDetails: tenantApi.getTenantDetails.bind(tenantApi),
  getWeaviateStatus: tenantApi.getWeaviateStatus.bind(tenantApi),
  getEmbedConfig: tenantApi.getEmbedConfig.bind(tenantApi),

  // Chat-Funktionen
  getCompletion: chatApi.getCompletion.bind(chatApi),
  getCompletionStream: chatApi.getCompletionStream.bind(chatApi),
  search: chatApi.search.bind(chatApi),
  
  // Dokument-Funktionen
  getDocuments: documentApi.getDocuments.bind(documentApi),
  getDocument: documentApi.getDocument.bind(documentApi),
  createDocument: documentApi.createDocument.bind(documentApi),
  uploadPdf: documentApi.uploadPdf.bind(documentApi),
  uploadCsv: documentApi.uploadCsv.bind(documentApi),
  uploadJson: documentApi.uploadJson.bind(documentApi),
  uploadMarkdown: documentApi.uploadMarkdown.bind(documentApi),
  deleteDocument: documentApi.deleteDocument.bind(documentApi),
  updateDocument: documentApi.updateDocument.bind(documentApi),
  getDocumentStatus: documentApi.getDocumentStatus.bind(documentApi),
  reindexDocument: documentApi.reindexDocument.bind(documentApi),
  reindexAllDocuments: documentApi.reindexAllDocuments.bind(documentApi),
  getDocumentWeaviateStatus: documentApi.getWeaviateStatus.bind(documentApi),
  
  // Agentur-Funktionen
  getAllAgencies: agencyApi.getAllAgencies.bind(agencyApi),
  getAgency: agencyApi.getAgency.bind(agencyApi),
  createAgency: agencyApi.createAgency.bind(agencyApi),
  updateAgency: agencyApi.updateAgency.bind(agencyApi),
  deleteAgency: agencyApi.deleteAgency.bind(agencyApi),
  assignTenantToAgency: agencyApi.assignTenantToAgency.bind(agencyApi),
  removeTenantFromAgency: agencyApi.removeTenantFromAgency.bind(agencyApi),
  
  // Interaktive Funktionen
  getInteractiveConfig: interactiveApi.getInteractiveConfig.bind(interactiveApi),
  updateInteractiveConfig: interactiveApi.updateInteractiveConfig.bind(interactiveApi),
  createInteractiveElement: interactiveApi.createInteractiveElement.bind(interactiveApi),
  updateInteractiveElement: interactiveApi.updateInteractiveElement.bind(interactiveApi),
  deleteInteractiveElement: interactiveApi.deleteInteractiveElement.bind(interactiveApi),
  
  // UI-Komponenten Funktionen
  getUIComponentsConfig: uiComponentsApi.getUIComponentsConfig.bind(uiComponentsApi),
  saveUIComponentsConfig: uiComponentsApi.saveUIComponentsConfig.bind(uiComponentsApi),
  getUIComponentDefinitions: uiComponentsApi.getUIComponentDefinitions.bind(uiComponentsApi),
  createUIComponentDefinition: uiComponentsApi.createUIComponentDefinition.bind(uiComponentsApi),
  updateUIComponentDefinition: uiComponentsApi.updateUIComponentDefinition.bind(uiComponentsApi),
  deleteUIComponentDefinition: uiComponentsApi.deleteUIComponentDefinition.bind(uiComponentsApi),
};

export default api; 