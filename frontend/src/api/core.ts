import axios, { AxiosInstance, AxiosHeaders } from 'axios';

// API-Basis-URL - IMMER NUR relativer Pfad
export const API_BASE_URL = '/api/v1';

// In der Konsole ausgeben, um zu bestätigen, dass wir die Proxy-URL verwenden
console.log('Using API URL through Next.js proxy:', API_BASE_URL);

// LocalStorage-Key für API-Key
export const API_KEY_STORAGE_KEY = 'tenant_api_key';

/**
 * Führt einen API-Aufruf aus.
 * 
 * @param url - Der API-Endpunkt-Pfad, relativ zu /api/v1, ohne führenden Schrägstrich
 * @param options - Optionen für den API-Aufruf
 * @returns Das API-Antwort-Objekt
 */
export async function callApi<T>(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    apiKey?: string;
    timeout?: number;
  } = {}
): Promise<T> {
  // WICHTIG: Im Browser muss die URL immer relativ sein ('/api/v1/...'),
  // damit der Next.js-Proxy verwendet wird.

  // Stelle sicher, dass wir einen relativen Pfad haben - beginnt immer mit /api
  if (!url.startsWith('/api')) {
    url = `/api${url.startsWith('/') ? '' : '/'}${url}`;
    console.log(`Korrigierter API-Pfad: ${url}`);
  }

  // Verwenden Sie standard Timeout von 30 Sekunden, wenn nicht angegeben
  const timeoutMs = options.timeout || 30000;
  
  // Ein AbortController für Timeout-Handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Headers vorbereiten
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    // Wenn ein API-Key angegeben ist, fügen wir ihn hinzu
    if (options.apiKey) {
      headers['X-API-Key'] = options.apiKey;
    }
    // Sonst verwenden wir den API-Key aus dem globalen Zustand, falls vorhanden
    else if (apiCore.getApiKey()) {
      const apiKeyValue = apiCore.getApiKey();
      if (apiKeyValue !== null) {
        headers['X-API-Key'] = apiKeyValue;
      }
    }

    console.log(`API-Aufruf: ${options.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      // Mode auf same-origin setzen, um zu verhindern, dass der Browser die Anfrage umleitet
      mode: 'same-origin',
      // Credentials auf same-origin setzen, um Cookies nur für die gleiche Domain zu senden
      credentials: 'same-origin',
    });

    clearTimeout(timeoutId);

    // Prüfen, ob der Request erfolgreich war
    if (!response.ok) {
      const statusText = response.statusText || 'Unknown Error';
      const responseText = await response.text();
      
      // Detaillierte Fehlermeldung mit Status-Code, URL und Response-Text
      const errorMessage = `${response.status} ${statusText} beim Aufruf von '${url}': ${responseText.substring(0, 100)}${responseText.length > 100 ? '...' : ''}`;
      
      console.error(`API-Fehler: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Leere Antwort behandeln (z.B. bei 204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    // Prüfen, ob die Antwort gültiges JSON enthält
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json() as T;
    } else {
      // Bei nicht-JSON-Antworten den Text zurückgeben
      const text = await response.text();
      return text as unknown as T;
    }
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Timeout-Fehler speziell behandeln
    if (error instanceof Error && 'name' in error && error.name === 'AbortError') {
      throw new Error(`Zeitüberschreitung bei Anfrage an '${url}' nach ${timeoutMs}ms`);
    }
    
    // Netzwerkfehler besser aufbereiten
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(`Netzwerkfehler beim Aufruf von '${url}': Möglicherweise besteht keine Internetverbindung oder der Server ist nicht erreichbar`);
    }
    
    // Originalen Fehler weiterwerfen mit URL-Kontext
    if (error instanceof Error) {
      throw new Error(`Fehler beim Aufruf von '${url}': ${error.message}`);
    }
    
    throw error;
  }
}

/**
 * Legacy API Core Klasse - wird beibehalten für Abwärtskompatibilität
 * @deprecated Verwende stattdessen die callApi-Funktion direkt
 */
export class ApiCore {
  protected client: AxiosInstance;
  protected apiKey: string | null = null;

  constructor() {
    // Immer RELATIVE URL verwenden für den Proxy
    this.client = axios.create({
      baseURL: API_BASE_URL, // Immer Proxy-Path
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      // Wichtig: Maximal 5 Weiterleitungen automatisch verfolgen
      maxRedirects: 5
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
  
  /**
   * Verbesserte Methode für API-Anfragen, die die neue callApi-Funktion verwendet
   * Diese Methode sollte für alle neuen Implementierungen verwendet werden
   */
  async request<T = any>(
    path: string,
    method: string = 'GET',
    data: any = null,
    additionalHeaders: Record<string, string> = {}
  ): Promise<T> {
    return callApi<T>(path, {
      method,
      body: data,
      headers: additionalHeaders,
      apiKey: this.apiKey || undefined
    });
  }
}

// Singleton-Instanz
export const apiCore = new ApiCore();
