import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Ressourcen-Nutzungs-Typ
interface ResourceUsage {
  cpu: number;
  memory: number;
  storage: number;
  network: number;
}

export function ResourceUsageCard() {
  const [usage, setUsage] = useState<ResourceUsage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Echte Daten von der API abrufen
  useEffect(() => {
    const fetchResourceUsage = async () => {
      try {
        setIsLoading(true);

        // Hier sollten die echten Daten von der API kommen
        // Im Echtsystem würde hier eine API-Anfrage stehen
        // apiClient.getResourceUsage() o.ä.
        
        // Simulierte API-Antwort für den Prototyp
        // TODO: Durch echten API-Aufruf ersetzen
        const data: ResourceUsage = {
          cpu: 42,
          memory: 58,
          storage: 34,
          network: 67
        };

        // Kurze Verzögerung simulieren
        setTimeout(() => {
          setUsage(data);
          setLastUpdated(new Date());
          setError(null);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Fehler beim Laden der Ressourcennutzung:", err);
        setError("Fehler beim Laden der Ressourcennutzung");
        setIsLoading(false);
      }
    };

    fetchResourceUsage();

    // Regelmäßige Aktualisierung (alle 60 Sekunden)
    const intervalId = setInterval(fetchResourceUsage, 60000);
    
    // Interval bei Unmount bereinigen
    return () => clearInterval(intervalId);
  }, []);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Ressourcen-Nutzung</CardTitle>
        <CardDescription>
          Aktuelle Auslastung des Systems
          {lastUpdated && (
            <span className="block text-xs mt-1">
              Zuletzt aktualisiert: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-16 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-8 h-4 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="h-2 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md text-sm">
            {error}
          </div>
        ) : usage && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">CPU</span>
                <span className="text-sm">{usage.cpu}%</span>
              </div>
              <Progress 
                value={usage.cpu} 
                className={usage.cpu > 80 ? 'bg-red-100' : usage.cpu > 60 ? 'bg-yellow-100' : 'bg-green-100'} 
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Speicher</span>
                <span className="text-sm">{usage.memory}%</span>
              </div>
              <Progress 
                value={usage.memory}
                className={usage.memory > 80 ? 'bg-red-100' : usage.memory > 60 ? 'bg-yellow-100' : 'bg-green-100'}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Speicherplatz</span>
                <span className="text-sm">{usage.storage}%</span>
              </div>
              <Progress 
                value={usage.storage}
                className={usage.storage > 80 ? 'bg-red-100' : usage.storage > 60 ? 'bg-yellow-100' : 'bg-green-100'}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Netzwerk</span>
                <span className="text-sm">{usage.network}%</span>
              </div>
              <Progress 
                value={usage.network}
                className={usage.network > 80 ? 'bg-red-100' : usage.network > 60 ? 'bg-yellow-100' : 'bg-green-100'}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 