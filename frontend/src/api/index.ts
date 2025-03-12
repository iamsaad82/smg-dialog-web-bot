import { authApi } from './auth';
import { userApi } from './users';
import { apiCore } from './core';
import { tenantApi } from './tenants';

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
};

export default api; 