import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { promisify } from 'util';

// Bestimme die korrekte Backend-URL basierend auf der Umgebung
function getBackendUrl() {
  // In Docker-Umgebungen den internen Hostnamen verwenden
  if (process.env.DOCKER_CONTAINER === 'true') {
    return 'http://backend:8000';
  }
  // Für lokale Entwicklung
  return 'http://localhost:8000';
}

// Deaktiviere die Standardkonfiguration für den Body-Parser von Next.js,
// damit wir FormData korrekt verarbeiten können
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Methode nicht erlaubt' });
  }

  try {
    const form = new IncomingForm();
    
    // Parsen des FormData
    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) return reject(err);
        resolve([fields, files]);
      });
    });

    // Extrahieren der Daten aus dem FormData
    const tenantId = Array.isArray(fields.tenant_id) ? fields.tenant_id[0] : fields.tenant_id;
    const titleColumn = Array.isArray(fields.title_column) ? fields.title_column[0] : fields.title_column;
    const contentColumn = Array.isArray(fields.content_column) ? fields.content_column[0] : fields.content_column;
    const sourceColumn = fields.source_column ? 
      (Array.isArray(fields.source_column) ? fields.source_column[0] : fields.source_column) : undefined;
    
    // Validierung
    if (!tenantId) {
      return res.status(400).json({ error: 'tenant_id ist erforderlich' });
    }
    
    if (!files.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }
    
    // Vorbereiten der FormData für das Backend
    const formData = new FormData();
    formData.append('tenant_id', tenantId);
    formData.append('title_column', titleColumn || 'title');
    formData.append('content_column', contentColumn || 'content');
    
    if (sourceColumn) {
      formData.append('source_column', sourceColumn);
    }
    
    // Datei aus dem temporären Speicher lesen und in FormData einfügen
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const fileData = await promisify(fs.readFile)(file.filepath);
    const blob = new Blob([fileData], { type: file.mimetype || 'text/csv' });
    formData.append('file', blob, file.originalFilename || 'document.csv');
    
    // API-Key aus dem Request-Header extrahieren
    const apiKey = req.headers['x-api-key'] || '';
    
    // Anfrage an das Backend senden
    const backendUrl = `${getBackendUrl()}/api/v1/documents/upload/csv`;
    const backendResponse = await axios.post(backendUrl, formData, {
      headers: {
        'X-API-Key': Array.isArray(apiKey) ? apiKey[0] : apiKey as string,
        'Content-Type': 'multipart/form-data',
      },
    });
    
    // Antwort vom Backend an den Client weiterleiten
    return res.status(backendResponse.status).json(backendResponse.data);
  } catch (error) {
    console.error('Fehler beim Upload der CSV-Datei:', error);
    
    // Strukturierte Fehlerbehandlung
    if (axios.isAxiosError(error) && error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    return res.status(500).json({ 
      error: 'Interner Serverfehler beim Hochladen der CSV-Datei',
      message: error instanceof Error ? error.message : 'Unbekannter Fehler'
    });
  }
} 