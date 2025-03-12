import { apiCore } from './core';
import { User, UserCreate, UserUpdate, ApiResponse } from '@/types/api';

class UserApi {
  private client = apiCore.getClient();

  async createUser(userData: UserCreate): Promise<User> {
    const response = await this.client.post<User>('/users', userData);
    return response.data;
  }

  async getUser(userId: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${userId}`);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<User>('/users/me');
    return response.data;
  }

  async getAllUsers(): Promise<User[]> {
    const response = await this.client.get<User[]>('/users');
    return response.data || [];
  }

  async updateUser(userId: string, userData: UserUpdate): Promise<User> {
    const response = await this.client.put<User>(`/users/${userId}`, userData);
    return response.data;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.delete(`/users/${userId}`);
  }

  async assignTenantToUser(userId: string, tenantId: string): Promise<void> {
    await this.client.post(`/users/${userId}/tenants/${tenantId}`);
  }

  async removeTenantFromUser(userId: string, tenantId: string): Promise<void> {
    await this.client.delete(`/users/${userId}/tenants/${tenantId}`);
  }

  async assignUserToAgency(userId: string, agencyId: string): Promise<void> {
    await this.client.post(`/users/${userId}/agency/${agencyId}`);
  }

  async removeUserFromAgency(userId: string): Promise<void> {
    await this.client.delete(`/users/${userId}/agency`);
  }
}

export const userApi = new UserApi(); 