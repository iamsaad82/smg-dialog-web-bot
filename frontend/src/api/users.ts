import { apiCore } from './core';
import { User, UserCreate, UserUpdate, ApiResponse, UserRole } from '@/types/api';

// TEMPORÄRER Dummy-Benutzer für die Entwicklung
const DUMMY_USERS: User[] = [
  {
    id: 'usr1',
    username: 'johndoe',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: UserRole.EDITOR,
    agency_id: 'agency1',
    assigned_tenant_ids: ['tenant1', 'tenant2'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr2',
    username: 'janesmith',
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role: UserRole.AGENCY_ADMIN,
    agency_id: 'agency1',
    assigned_tenant_ids: ['tenant1', 'tenant2', 'tenant3'],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'usr3',
    username: 'adminuser',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
    agency_id: null,
    assigned_tenant_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'temp-admin-id',
    username: 'admin',
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    role: UserRole.ADMIN,
    agency_id: null,
    assigned_tenant_ids: [],
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

class UserApi {
  private client = apiCore.getClient();
  private isDevelopment = process.env.NODE_ENV === 'development';

  async createUser(userData: UserCreate): Promise<User> {
    try {
      // Echten API-Aufruf immer durchführen, Fallback nur im Fehlerfall
      const response = await this.client.post<User>('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Erstellen des Benutzers:', error);
      
      if (this.isDevelopment) {
        console.log('ENTWICKLUNGSMODUS: Simuliere Benutzer-Erstellung als Fallback');
        const dummyUser: User = {
          id: 'new-' + Date.now().toString(),
          username: userData.username,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role,
          agency_id: userData.agency_id || null,
          assigned_tenant_ids: userData.assigned_tenant_ids || [],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        DUMMY_USERS.push(dummyUser);
        return dummyUser;
      }
      
      throw error;
    }
  }

  async getUser(userId: string): Promise<User> {
    try {
      const response = await this.client.get<User>(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Fehler beim Laden des Benutzers ${userId}:`, error);
      
      if (this.isDevelopment) {
        console.log(`ENTWICKLUNGSMODUS: Verwende Dummy-Benutzer für ID ${userId}`);
        
        const dummyUser = DUMMY_USERS.find(user => user.id === userId);
        
        if (!dummyUser) {
          console.log(`ENTWICKLUNGSMODUS: Kein passender Benutzer gefunden, erstelle generischen Benutzer`);
          const genericUser: User = {
            id: userId,
            username: `user_${userId}`,
            email: `user_${userId}@example.com`,
            first_name: 'Benutzer',
            last_name: userId,
            role: UserRole.VIEWER,
            agency_id: 'agency1',
            assigned_tenant_ids: ['tenant1'],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          return genericUser;
        }
        
        return dummyUser;
      }
      
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.client.get<User>('/users/me');
      return response.data;
    } catch (error) {
      console.error('Fehler beim Laden des aktuellen Benutzers:', error);
      
      if (this.isDevelopment) {
        console.log('ENTWICKLUNGSMODUS: Verwende Admin-Benutzer für aktuellen Benutzer');
        return DUMMY_USERS.find(user => user.username === 'admin') || DUMMY_USERS[0];
      }
      
      throw error;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const response = await this.client.get<User[]>('/users');
      return response.data || [];
    } catch (error) {
      console.error('Fehler beim Laden aller Benutzer:', error);
      
      if (this.isDevelopment) {
        console.log('ENTWICKLUNGSMODUS: Verwende Dummy-Benutzer');
        return [...DUMMY_USERS];
      }
      
      throw error;
    }
  }

  async updateUser(userData: UserUpdate & { id: string }): Promise<User> {
    try {
      const userId = userData.id;
      if (!userId) throw new Error('Keine Benutzer-ID angegeben');
      
      const response = await this.client.put<User>(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Benutzers:', error);
      
      if (this.isDevelopment) {
        console.log('ENTWICKLUNGSMODUS: Simuliere Benutzer-Aktualisierung');
        
        const userId = userData.id;
        if (!userId) throw new Error('Keine Benutzer-ID angegeben');
        
        const userIndex = DUMMY_USERS.findIndex(user => user.id === userId);
        
        if (userIndex >= 0) {
          const updatedUser = {
            ...DUMMY_USERS[userIndex],
            ...userData,
            updated_at: new Date().toISOString()
          };
          
          DUMMY_USERS[userIndex] = updatedUser;
          return updatedUser;
        } else {
          throw new Error(`Benutzer mit ID ${userId} nicht gefunden`);
        }
      }
      
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.delete(`/users/${userId}`);
    } catch (error) {
      console.error(`Fehler beim Löschen des Benutzers ${userId}:`, error);
      
      if (this.isDevelopment) {
        console.log(`ENTWICKLUNGSMODUS: Simuliere Löschen des Benutzers ${userId}`);
        
        const userIndex = DUMMY_USERS.findIndex(user => user.id === userId);
        
        if (userIndex >= 0) {
          DUMMY_USERS.splice(userIndex, 1);
        }
        
        return;
      }
      
      throw error;
    }
  }

  async assignTenantToUser(userId: string, tenantId: string): Promise<void> {
    try {
      await this.client.post(`/users/${userId}/tenants/${tenantId}`);
    } catch (error) {
      console.error(`Fehler beim Zuweisen des Tenants ${tenantId} zum Benutzer ${userId}:`, error);
      
      if (this.isDevelopment) {
        console.log(`ENTWICKLUNGSMODUS: Simuliere Zuweisung von Tenant ${tenantId} zu Benutzer ${userId}`);
        
        const userIndex = DUMMY_USERS.findIndex(user => user.id === userId);
        
        if (userIndex >= 0) {
          if (!DUMMY_USERS[userIndex].assigned_tenant_ids.includes(tenantId)) {
            DUMMY_USERS[userIndex].assigned_tenant_ids.push(tenantId);
          }
        }
        
        return;
      }
      
      throw error;
    }
  }

  async removeTenantFromUser(userId: string, tenantId: string): Promise<void> {
    try {
      await this.client.delete(`/users/${userId}/tenants/${tenantId}`);
    } catch (error) {
      console.error(`Fehler beim Entfernen des Tenants ${tenantId} vom Benutzer ${userId}:`, error);
      
      if (this.isDevelopment) {
        console.log(`ENTWICKLUNGSMODUS: Simuliere Entfernen von Tenant ${tenantId} von Benutzer ${userId}`);
        
        const userIndex = DUMMY_USERS.findIndex(user => user.id === userId);
        
        if (userIndex >= 0) {
          DUMMY_USERS[userIndex].assigned_tenant_ids = DUMMY_USERS[userIndex].assigned_tenant_ids.filter(
            id => id !== tenantId
          );
        }
        
        return;
      }
      
      throw error;
    }
  }

  async assignUserToAgency(userId: string, agencyId: string): Promise<void> {
    try {
      await this.client.post(`/users/${userId}/agency/${agencyId}`);
    } catch (error) {
      console.error(`Fehler beim Zuweisen des Benutzers ${userId} zur Agentur ${agencyId}:`, error);
      
      if (this.isDevelopment) {
        console.log(`ENTWICKLUNGSMODUS: Simuliere Zuweisung von Benutzer ${userId} zu Agentur ${agencyId}`);
        
        const userIndex = DUMMY_USERS.findIndex(user => user.id === userId);
        
        if (userIndex >= 0) {
          DUMMY_USERS[userIndex].agency_id = agencyId;
        }
        
        return;
      }
      
      throw error;
    }
  }

  async removeUserFromAgency(userId: string): Promise<void> {
    try {
      await this.client.delete(`/users/${userId}/agency`);
    } catch (error) {
      console.error(`Fehler beim Entfernen des Benutzers ${userId} von der Agentur:`, error);
      
      if (this.isDevelopment) {
        console.log(`ENTWICKLUNGSMODUS: Simuliere Entfernen von Benutzer ${userId} von der Agentur`);
        
        const userIndex = DUMMY_USERS.findIndex(user => user.id === userId);
        
        if (userIndex >= 0) {
          DUMMY_USERS[userIndex].agency_id = null;
        }
        
        return;
      }
      
      throw error;
    }
  }
}

export const userApi = new UserApi(); 