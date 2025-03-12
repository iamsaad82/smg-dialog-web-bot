import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Search, Filter } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Log-Eintrag
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  service: string;
  message: string;
  details?: string;
}

export function LogsViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter-Status
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Logs beim ersten Laden der Komponente abrufen
  useEffect(() => {
    fetchLogs();
  }, []);

  // Logs erneut abrufen
  const fetchLogs = async () => {
    setIsLoading(true);
    
    try {
      // Hier sollten die echten Daten von der API kommen
      // Im Echtsystem würde hier eine API-Anfrage stehen
      // apiClient.getSystemLogs() o.ä.
      
      // Simulierte Logs für den Prototyp
      const now = new Date();
      const simulatedLogs: LogEntry[] = [
        {
          id: '1',
          timestamp: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'api-server',
          message: 'Server gestartet'
        },
        {
          id: '2',
          timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
          level: 'warning',
          service: 'embedding-service',
          message: 'Erhöhte Latenz bei Embedding-Anfragen',
          details: 'Durchschnittliche Antwortzeit: 230ms'
        },
        {
          id: '3',
          timestamp: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          level: 'error',
          service: 'database',
          message: 'Verbindungsprobleme zur Datenbank',
          details: 'Timeout bei Verbindungsaufbau. Automatischer Wiederverbindungsversuch.'
        },
        {
          id: '4',
          timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'weaviate',
          message: 'Vector-Datenbank erfolgreich initialisiert'
        },
        {
          id: '5',
          timestamp: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
          level: 'debug',
          service: 'llm-service',
          message: 'Modell-Parameter für Anfrage',
          details: '{"model": "gpt-4", "temperature": 0.7, "top_p": 1.0}'
        },
        {
          id: '6',
          timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(),
          level: 'info',
          service: 'api-server',
          message: 'Neue Kunden-Anfrage verarbeitet: AOK Bayern'
        },
        {
          id: '7',
          timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          level: 'warning',
          service: 'llm-service',
          message: 'Hohe Auslastung des LLM-Services',
          details: 'Aktuelle Anfragen: 150/min'
        },
      ];

      // Kurze Verzögerung simulieren
      setTimeout(() => {
        setLogs(simulatedLogs);
        setFilteredLogs(simulatedLogs);
        setError(null);
        setIsLoading(false);
      }, 800);
    } catch (err) {
      console.error('Fehler beim Laden der Logs:', err);
      setError('Fehler beim Laden der System-Logs');
      setIsLoading(false);
    }
  };

  // Logs filtern, wenn sich die Filter-Einstellungen ändern
  useEffect(() => {
    if (!logs.length) return;

    const filtered = logs.filter(log => {
      // Textsuche
      const matchesSearch = searchTerm === '' || 
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Level-Filter
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      
      // Service-Filter
      const matchesService = serviceFilter === 'all' || log.service === serviceFilter;
      
      return matchesSearch && matchesLevel && matchesService;
    });
    
    setFilteredLogs(filtered);
  }, [logs, searchTerm, levelFilter, serviceFilter]);

  // Verfügbare Services für Filter ermitteln
  const availableServices = Array.from(new Set(logs.map(log => log.service)));

  // Logs exportieren (als JSON-Datei)
  const handleExportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `system-logs-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // CSS-Klasse je nach Log-Level
  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-800 bg-red-100';
      case 'warning': return 'text-yellow-800 bg-yellow-100';
      case 'info': return 'text-blue-800 bg-blue-100';
      case 'debug': return 'text-gray-800 bg-gray-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>System-Logs</CardTitle>
        <CardDescription>
          System-Ereignisse und Fehler der letzten 24 Stunden
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter-Bereich */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Logs durchsuchen..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Log-Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Level</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Service" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Services</SelectItem>
                {availableServices.map(service => (
                  <SelectItem key={service} value={service}>{service}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={fetchLogs} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Aktualisieren
            </Button>
          </div>
        </div>
        
        {/* Logs-Tabelle */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Zeitpunkt</TableHead>
                <TableHead className="w-[100px]">Level</TableHead>
                <TableHead className="w-[150px]">Service</TableHead>
                <TableHead>Nachricht</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Lade-Animation
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-32"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-6 bg-muted rounded animate-pulse w-16"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-24"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-red-600">{error}</TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Keine Logs gefunden</TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="group">
                    <TableCell className="font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString('de-DE')}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeClass(log.level)}`}>
                        {log.level}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{log.service}</TableCell>
                    <TableCell>
                      <div>
                        {log.message}
                        {log.details && (
                          <div className="mt-1 text-xs text-muted-foreground bg-muted p-2 rounded overflow-x-auto hidden group-hover:block">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredLogs.length} {filteredLogs.length === 1 ? 'Eintrag' : 'Einträge'} angezeigt
          {logs.length !== filteredLogs.length && ` (gefiltert aus ${logs.length})`}
        </div>
        <Button variant="outline" onClick={handleExportLogs} disabled={filteredLogs.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Logs exportieren
        </Button>
      </CardFooter>
    </Card>
  );
} 