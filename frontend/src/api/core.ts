import axios, { AxiosInstance, AxiosHeaders } from 'axios';

// API-Basis-URL - direkter Zugriff auf das Backend
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// LocalStorage-Key für API-Key
export const API_KEY_STORAGE_KEY = 'tenant_api_key';

export class ApiCore {
  protected client: AxiosInstance;
  protected apiKey: string | null = null;

  constructor() {
    // Immer die Backend-URL verwenden
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    // Interceptor für API-Key
    this.client.interceptors.request.use((config) => {
      if (this.apiKey) {
        if (!config.headers) {
          config.headers = new AxiosHeaders();
        }
        config.headers['X-API-Key'] = this.apiKey;
        console.log('Request Config:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          baseURL: config.baseURL
        });
      }
      return config;
    });

    // Response Interceptor für bessere Fehlerbehandlung
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          data: error.response?.data
        });
        throw error;
      }
    );
  }

  // Getter für den HTTP-Client
  getClient(): AxiosInstance {
    return this.client;
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }

  // API-Key abrufen
  getApiKey(): string | null {
    return this.apiKey;
  }

  // API-Key löschen
  clearApiKey() {
    this.apiKey = null;
    // Auch aus dem localStorage löschen
    if (typeof window !== 'undefined') {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }
}

// Singleton-Instanz
export const apiCore = new ApiCore(); 