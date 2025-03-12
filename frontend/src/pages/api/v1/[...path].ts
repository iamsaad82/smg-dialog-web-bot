import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';

// API-Proxy-Handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return new Promise((resolve, reject) => {
    const { method, headers, query, body } = req;
    const path = (req.query.path as string[]).join('/');
    
    // Zieloptionen konfigurieren
    const options = {
      hostname: 'backend', // Docker-Service-Name
      port: 8000,
      path: `/api/v1/${path}${req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''}`,
      method: method,
      headers: {
        ...headers,
        host: 'backend:8000',
      },
    };
    
    console.log(`Proxying to: ${options.method} ${options.hostname}:${options.port}${options.path}`);
    
    const proxyReq = http.request(options, (proxyRes) => {
      res.statusCode = proxyRes.statusCode || 200;
      
      // Headers weiterleiten
      Object.keys(proxyRes.headers).forEach((key) => {
        if (proxyRes.headers[key]) {
          res.setHeader(key, proxyRes.headers[key] as string);
        }
      });
      
      // Antwort zum Client weiterleiten
      proxyRes.pipe(res);
      proxyRes.on('end', resolve);
    });
    
    // Fehlerbehandlung
    proxyReq.on('error', (error) => {
      console.error('Proxy-Fehler:', error);
      res.status(500).json({ error: 'Proxy-Fehler', message: error.message });
      resolve(error);
    });
    
    // Anfragekörper weiterleiten
    if (body && ['POST', 'PUT', 'PATCH'].includes(method || '')) {
      proxyReq.write(typeof body === 'object' ? JSON.stringify(body) : body);
    }
    
    proxyReq.end();
  });
}

// Konfiguration für Server-Timing-Optionen
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
}; 