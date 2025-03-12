import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Service-Status-Typ
interface ServiceStatus {
  name: string;
  status: 'online' | 'warning' | 'offline';
  latency: string;
}

export function SystemStatusCard() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Funktion, die den Status der Dienste lädt
  const fetchStatus = async () => {
    try {
      setIsLoading(true);
      
      // Hier sollten die echten Daten von der API kommen
      // Im Echtsystem würde hier eine API-Anfrage stehen
      // apiClient.getSystemStatus() o.ä.
      
      // Simulierte API-Antwort für den Prototyp
      // TODO: Durch echten API-Aufruf ersetzen
      const data: ServiceStatus[] = [
        { name: "API-Server", status: "online", latency: "42ms" },
        { name: "Datenbank", status: "online", latency: "23ms" },
        { name: "Vector-DB", status: "online", latency: "65ms" },
        { name: "LLM-Service", status: "warning", latency: "230ms" },
        { name: "Embedding-Service", status: "online", latency: "85ms" }
      ];
      
      // Kurze Verzögerung simulieren
      setTimeout(() => {
        setServices(data);
        setLastUpdated(new Date());
        setError(null);
        setIsLoading(false);
      }, 800);
    } catch (err) {
      console.error("Fehler beim Laden des System-Status:", err);
      setError("Fehler beim Laden des System-Status");
      setIsLoading(false);
    }
  };

  // Status beim ersten Laden abrufen
  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>System-Status</CardTitle>
        <CardDescription>
          Aktuelle Verfügbarkeit aller Dienste
          {lastUpdated && (
            <span className="block text-xs mt-1">
              Zuletzt aktualisiert: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="w-24 h-4 bg-muted rounded animate-pulse"></div>
                <div className="w-12 h-4 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${
                    service.status === 'online' ? 'bg-green-500' : 
                    service.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm">{service.name}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground">{service.latency}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={fetchStatus} 
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Status aktualisieren
        </Button>
      </CardFooter>
    </Card>
  );
} 