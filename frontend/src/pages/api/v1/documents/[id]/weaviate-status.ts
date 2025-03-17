import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Bestimme die korrekte Backend-URL basierend auf der Umgebung
function getBackendUrl() {
  // In Docker-Umgebungen den internen Hostnamen verwenden
  if (process.env.DOCKER_CONTAINER === 'true') {
    return 'http://backend:8000';
  }
  // Für lokale Entwicklung
  return 'http://localhost:8000';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query; // Dokument-ID aus der URL
  const { tenant_id, ...restQuery } = req.query;
  const apiKey = req.headers['x-api-key'] || '';
  
  try {
    // Validierung
    if (!tenant_id) {
      return res.status(400).json({ error: 'tenant_id ist erforderlich' });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Dokument-ID ist erforderlich' });
    }
    
    // Erstelle die URL für die Backend-Anfrage
    const backendUrl = `${getBackendUrl()}/api/v1/documents/${id}/weaviate-status`;
    
    // Führe die Anfrage an das Backend aus
    const backendResponse = await axios({
      method: req.method,
      url: backendUrl,
      params: { tenant_id, ...restQuery },
      headers: {
        'X-API-Key': Array.isArray(apiKey) ? apiKey[0] : apiKey as string,
        'Content-Type': 'application/json',
      },
    });
    
    // Sende die Backend-Antwort zurück an den Client
    return res.status(backendResponse.status).json(backendResponse.data);
  } catch (error) {
    console.error(`Fehler beim Abrufen des Weaviate-Status für Dokument ${id}:`, error);
    
    // Fehlerbehandlung - stellt sicher, dass eine gültige Antwort zurückgegeben wird
    if (axios.isAxiosError(error) && error.response) {
      // Backend-Fehlerantwort an den Client weitergeben
      return res.status(error.response.status).json(error.response.data);
    }
    
    // Allgemeiner Fehler
    return res.status(500).json({ 
      error: 'Serverfehler bei der Kommunikation mit dem Backend',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
} 