import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types/api';
import { apiCore } from '@/api/core';

// AuthState Interface
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// AuthContext Interface
interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  resetError: () => void;
  checkRole: (roles: UserRole[]) => boolean;
}

// Default Authentifizierungsstatus
const defaultAuthState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Speicherschlüssel für Auth-Daten im localStorage
const AUTH_STORAGE_KEY = 'auth_data';

// Auth Context erstellen
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Komponente
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(defaultAuthState);

  // Beim Initialisieren Authentifizierungsdaten aus dem localStorage laden
  useEffect(() => {
    const loadAuthData = async () => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));
        
        const storedAuthData = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedAuthData) {
          const authData = JSON.parse(storedAuthData);
          
          // API-Key für alle Anfragen setzen
          if (authData.accessToken) {
            apiCore.setApiKey(authData.accessToken);
          }
          
          setState({
            user: authData.user || null,
            accessToken: authData.accessToken || null,
            refreshToken: authData.refreshToken || null,
            isAuthenticated: !!authData.user && !!authData.accessToken,
            isLoading: false,
            error: null,
          });
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Fehler beim Laden der Auth-Daten:', error);
        setState((prev) => ({ 
          ...prev, 
          isLoading: false,
          error: 'Fehler beim Laden der Authentifizierungsdaten'
        }));
      }
    };
    
    loadAuthData();
  }, []);

  // Login-Funktion
  const login = async (username: string, password: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      
      // Login-Request
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
      
      // API-Key für alle Anfragen setzen
      apiCore.setApiKey(data.access_token);
      
      // Auth-Daten speichern
      const authData = {
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
      
      // Daten im localStorage speichern
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      
      // State aktualisieren
      setState({
        user: data.user,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Login-Fehler:', error);
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Anmeldung fehlgeschlagen',
      }));
      throw error;
    }
  };

  // Logout-Funktion
  const logout = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      
      if (state.accessToken) {
        // Logout-Request
        try {
          await fetch('/api/v1/auth/logout', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${state.accessToken}`,
            },
          });
        } catch (error) {
          console.error('Logout-API-Fehler (ignoriert):', error);
        }
      }
    } catch (error) {
      console.error('Logout-Fehler:', error);
    } finally {
      // API-Key zurücksetzen
      apiCore.clearApiKey();
      
      // Auth-Daten aus dem localStorage entfernen
      localStorage.removeItem(AUTH_STORAGE_KEY);
      
      // State zurücksetzen
      setState({
        ...defaultAuthState,
        isLoading: false,
      });
    }
  };

  // Token-Refresh-Funktion
  const refreshAuth = async (): Promise<boolean> => {
    try {
      if (!state.refreshToken) {
        return false;
      }
      
      // Refresh-Token-Request
      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: state.refreshToken,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Token-Refresh fehlgeschlagen');
      }
      
      const data = await response.json();
      
      // API-Key für alle Anfragen aktualisieren
      apiCore.setApiKey(data.access_token);
      
      // Auth-Daten aktualisieren
      const authData = {
        ...state,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      };
      
      // Daten im localStorage aktualisieren
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
      
      // State aktualisieren
      setState((prev) => ({
        ...prev,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      }));
      
      return true;
    } catch (error) {
      console.error('Token-Refresh-Fehler:', error);
      
      // Bei einem Fehler ausloggen
      await logout();
      
      return false;
    }
  };

  // Fehler zurücksetzen
  const resetError = () => {
    setState((prev) => ({ ...prev, error: null }));
  };
  
  // Rollenprüfung
  const checkRole = (roles: UserRole[]): boolean => {
    if (!state.user) return false;
    return roles.includes(state.user.role as UserRole);
  };

  // Context-Provider rendern
  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshAuth,
        resetError,
        checkRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook zum Zugriff auf den Auth-Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth muss innerhalb eines AuthProviders verwendet werden');
  }
  return context;
}; 