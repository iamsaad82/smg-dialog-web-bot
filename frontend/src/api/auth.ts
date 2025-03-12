import { apiCore } from './core';
import { User } from '@/types/api';

interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

class AuthApi {
  // Login mit Benutzername und Passwort
  async login(username: string, password: string): Promise<LoginResponse> {
    // Wir verwenden fetch direkt mit URLSearchParams für den Login,
    // da der OAuth2-Endpunkt application/x-www-form-urlencoded erwartet
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Anmeldung fehlgeschlagen');
    }

    const data = await response.json();
    return data as LoginResponse;
  }

  // Aktuelles Benutzerprofil abrufen
  async getCurrentUser(): Promise<User> {
    const client = apiCore.getClient();
    const response = await client.get<User>('/auth/me');
    return response.data;
  }

  // Token aktualisieren
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const client = apiCore.getClient();
    const response = await client.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  }

  // Abmelden
  async logout(): Promise<void> {
    const client = apiCore.getClient();
    await client.post('/auth/logout');
    apiCore.clearApiKey();
  }

  // Passwort-Reset anfordern
  async requestPasswordReset(email: string): Promise<void> {
    const client = apiCore.getClient();
    await client.post('/auth/reset-password', { email });
  }

  // Passwort zurücksetzen
  async resetPassword(token: string, newPassword: string): Promise<User> {
    const client = apiCore.getClient();
    const response = await client.post<User>('/auth/reset-password-confirm', {
      token,
      new_password: newPassword,
    });
    return response.data;
  }

  async confirmPasswordReset(token: string, new_password: string): Promise<User> {
    const client = apiCore.getClient();
    const response = await client.post<User>('/auth/reset-password-confirm', {
      token,
      new_password
    });
    return response.data;
  }
}

export const authApi = new AuthApi(); 