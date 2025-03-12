import React, { useState, useEffect } from 'react';
import { PuzzleIcon } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Komponenten-Statistik-Typ
interface ComponentStat {
  name: string;
  count: number;
  success: number;
}

export function ComponentsStatsCard() {
  const [stats, setStats] = useState<ComponentStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Statistiken beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchComponentStats = async () => {
      try {
        setIsLoading(true);
        
        // Hier sollten die echten Daten von der API kommen
        // Im Echtsystem würde hier eine API-Anfrage stehen
        // apiClient.getComponentStats() o.ä.
        
        // Simulierte API-Antwort für den Prototyp
        // TODO: Durch echten API-Aufruf ersetzen
        const data: ComponentStat[] = [
          { name: "OpeningHoursTable", count: 12, success: 96 },
          { name: "StoreMap", count: 8, success: 94 },
          { name: "ProductShowcase", count: 15, success: 98 },
          { name: "ContactCard", count: 22, success: 92 }
        ];

        // Kurze Verzögerung simulieren
        setTimeout(() => {
          setStats(data);
          setError(null);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Fehler beim Laden der Komponenten-Statistiken:", err);
        setError("Fehler beim Laden der Komponenten-Statistiken");
        setIsLoading(false);
      }
    };

    fetchComponentStats();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>UI-Komponenten Übersicht</CardTitle>
        <CardDescription>
          Nutzung und Performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-36 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-muted rounded animate-pulse"></div>
                </div>
                <div className="w-full h-4 bg-muted rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            {stats.map((component) => (
              <div key={component.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PuzzleIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">{component.name}</span>
                  </div>
                  <div>
                    <Badge variant="outline">{component.count} aktiv</Badge>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Erfolgsrate</span>
                    <span>{component.success}%</span>
                  </div>
                  <Progress 
                    value={component.success} 
                    className={`h-2 ${
                      component.success >= 95 ? 'bg-green-100' : 
                      component.success >= 90 ? 'bg-yellow-100' : 'bg-red-100'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 