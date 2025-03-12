import { apiCore } from './core';
import { Agency, AgencyCreate, AgencyUpdate, ApiResponse } from '@/types/api';

class AgencyApi {
  private client = apiCore.getClient();

  async createAgency(agency: AgencyCreate): Promise<Agency> {
    const response = await this.client.post<Agency>('/agencies', agency);
    return response.data;
  }

  async getAgency(agencyId: string): Promise<Agency> {
    const response = await this.client.get<Agency>(`/agencies/${agencyId}`);
    return response.data;
  }

  async getAllAgencies(): Promise<Agency[]> {
    const response = await this.client.get<Agency[]>('/agencies');
    return response.data || [];
  }

  async updateAgency(agencyId: string, agencyData: AgencyUpdate): Promise<Agency> {
    const response = await this.client.put<Agency>(`/agencies/${agencyId}`, agencyData);
    return response.data;
  }

  async deleteAgency(agencyId: string): Promise<void> {
    await this.client.delete(`/agencies/${agencyId}`);
  }

  async assignTenantToAgency(agencyId: string, tenantId: string): Promise<void> {
    await this.client.post(`/agencies/${agencyId}/tenants/${tenantId}`);
  }

  async removeTenantFromAgency(agencyId: string, tenantId: string): Promise<void> {
    await this.client.delete(`/agencies/${agencyId}/tenants/${tenantId}`);
  }
}

export const agencyApi = new AgencyApi(); 