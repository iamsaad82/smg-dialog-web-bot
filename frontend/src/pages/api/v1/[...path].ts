import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

// API-Proxy-Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('⚡⚡⚡ API-Route aufgerufen:', req.url, req.method);
  
  return new Promise<void>((resolve) => {
    const { method, headers, query, body } = req;
    const path = (req.query.path as string[]).join('/');
    
    // Verwende die richtige Backend-URL basierend auf der Umgebung
    const isDocker = process.env.DOCKER_CONTAINER === 'true';
    console.log('⚡⚡⚡ DOCKER_CONTAINER Umgebungsvariable:', process.env.DOCKER_CONTAINER);
    console.log('⚡⚡⚡ isDocker:', isDocker);
    
    const backendHost = isDocker ? 'backend' : 'localhost';
    console.log('⚡⚡⚡ backendHost:', backendHost);
    
    // Zieloptionen konfigurieren
    const options = {
      hostname: backendHost,
      port: 8000,
      path: `/api/v1/${path}${req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`,
      method: method,
      headers: {
        ...headers,
        host: `${backendHost}:8000`,
      },
    };
    
    console.log(`⚡⚡⚡ Proxying to: ${options.method} ${options.hostname}:${options.port}${options.path}`);
    
    // Funktion, um Anfragen zu senden und automatisch Weiterleitungen zu folgen
    const sendRequest = (requestOptions: any, maxRedirects = 5) => {
      if (maxRedirects <= 0) {
        res.status(500).json({ error: 'Zu viele Weiterleitungen' });
        return resolve();
      }
      
      console.log(`⚡⚡⚡ Sende Anfrage an: ${requestOptions.method} ${requestOptions.hostname}:${requestOptions.port}${requestOptions.path}`);
      
      const httpModule = requestOptions.protocol === 'https:' ? https : http;
      const proxyReq = httpModule.request(requestOptions, (proxyRes) => {
        console.log(`⚡⚡⚡ Antwort erhalten: ${proxyRes.statusCode}`);
        
        // Bei Weiterleitung (3xx) automatisch folgen
        if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
          const redirectUrl = proxyRes.headers.location;
          console.log('⚡⚡⚡ Weiterleitung erkannt:', redirectUrl);
          
          if (!redirectUrl) {
            res.status(500).json({ error: 'Weiterleitung ohne Ziel' });
            return resolve();
          }
          
          let redirectOptions: any;
          try {
            // URL parsen für absolute oder relative Weiterleitung
            const isAbsolute = redirectUrl.startsWith('http');
            if (isAbsolute) {
              const parsedUrl = new URL(redirectUrl);
              redirectOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: method,
                protocol: parsedUrl.protocol,
                headers: {
                  ...headers,
                  host: parsedUrl.host,
                }
              };
            } else {
              // Relative URL, bestehende Optionen nutzen
              redirectOptions = {
                ...requestOptions,
                path: redirectUrl.startsWith('/') ? redirectUrl : `/${redirectUrl}`
              };
            }
            
            console.log(`⚡⚡⚡ Folge Weiterleitung zu: ${redirectOptions.hostname}:${redirectOptions.port}${redirectOptions.path}`);
            
            // Rekursiv Anfrage senden und Weiterleitung folgen
            return sendRequest(redirectOptions, maxRedirects - 1);
          } catch (error) {
            console.error('⚡⚡⚡ Fehler beim Folgen der Weiterleitung:', error);
            res.status(500).json({ error: 'Fehler beim Folgen der Weiterleitung' });
            return resolve();
          }
        }
        
        // Normal Antwort (kein Redirect)
        console.log('⚡⚡⚡ Normale Antwort erhalten, leite weiter zum Client');
        
        // Status-Code setzen
        res.statusCode = proxyRes.statusCode || 200;
        
        // Headers weiterleiten (außer Weiterleitungs-Header)
        Object.keys(proxyRes.headers).forEach((key) => {
          if (proxyRes.headers[key] && !['location', 'refresh'].includes(key.toLowerCase())) {
            res.setHeader(key, proxyRes.headers[key] as string);
          }
        });
        
        // Antwort zum Client weiterleiten
        proxyRes.pipe(res);
        
        // Fertig, wenn Antwort vollständig übertragen
        proxyRes.on('end', () => {
          console.log('⚡⚡⚡ Antwort vollständig übertragen');
          resolve();
        });
      });
      
      // Fehlerbehandlung für die Anfrage
      proxyReq.on('error', (error) => {
        console.error('⚡⚡⚡ Fehler bei der Anfrage:', error);
        res.status(500).json({ 
          error: 'Proxy-Fehler', 
          message: error.message,
          code: (error as any).code
        });
        resolve();
      });
      
      // Anfragekörper senden (für POST, PUT, etc.)
      if (body && ['POST', 'PUT', 'PATCH'].includes(method || '')) {
        proxyReq.write(typeof body === 'object' ? JSON.stringify(body) : body);
      }
      
      // Anfrage abschließen
      proxyReq.end();
    };
    
    // Initial Request starten
    sendRequest(options);
  });
}

// Konfiguration für NextJS API-Route
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
}; 