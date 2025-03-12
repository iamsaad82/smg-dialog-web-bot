import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

// Aktivitäts-Typ
interface Activity {
  id: string;
  type: 'tenant' | 'document' | 'component' | 'chat' | 'system';
  text: string;
  time: string; // Beschreibende Zeitangabe
  timestamp: Date; // Tatsächlicher Zeitstempel
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Aktivitäten beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        
        // Hier sollten die echten Daten von der API kommen
        // Im Echtsystem würde hier eine API-Anfrage stehen
        // apiClient.getRecentActivities() o.ä.
        
        // Simulierte API-Antwort für den Prototyp
        // TODO: Durch echten API-Aufruf ersetzen
        const now = new Date();
        const data: Activity[] = [
          { 
            id: '1', 
            type: 'tenant', 
            text: 'Neuer Tenant erstellt: AOK Bayern', 
            time: 'Vor 12 Minuten',
            timestamp: new Date(now.getTime() - 12 * 60 * 1000)
          },
          { 
            id: '2', 
            type: 'document', 
            text: '48 Dokumente neu indexiert für Stadtwerke München', 
            time: 'Vor 28 Minuten',
            timestamp: new Date(now.getTime() - 28 * 60 * 1000)
          },
          { 
            id: '3', 
            type: 'component', 
            text: 'UI-Komponente "OpeningHoursTable" aktualisiert', 
            time: 'Vor 42 Minuten',
            timestamp: new Date(now.getTime() - 42 * 60 * 1000)
          },
          { 
            id: '4', 
            type: 'chat', 
            text: 'Spitzenbelastung: 128 gleichzeitige Chat-Sessions', 
            time: 'Vor 1 Stunde',
            timestamp: new Date(now.getTime() - 1 * 60 * 60 * 1000)
          },
          { 
            id: '5', 
            type: 'system', 
            text: 'System-Update erfolgreich abgeschlossen', 
            time: 'Vor 3 Stunden',
            timestamp: new Date(now.getTime() - 3 * 60 * 60 * 1000)
          }
        ];

        // Kurze Verzögerung simulieren
        setTimeout(() => {
          setActivities(data);
          setError(null);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Fehler beim Laden der Aktivitäten:", err);
        setError("Fehler beim Laden der Aktivitäten");
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Hintergrundfarbe für den Aktivitätstyp bestimmen
  const getTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'tenant': return 'bg-blue-500';
      case 'document': return 'bg-green-500';
      case 'component': return 'bg-purple-500';
      case 'chat': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Letzte Aktivitäten</CardTitle>
        <CardDescription>
          System-Ereignisse und Updates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex">
                <div className="mr-4 relative">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                  {i < 5 && <div className="absolute top-3 bottom-0 left-1 w-[1px] bg-gray-200"></div>}
                </div>
                <div className="flex-1 pb-4">
                  <div className="w-3/4 h-4 bg-muted rounded animate-pulse"></div>
                  <div className="w-1/4 h-3 mt-1 bg-muted rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-800 rounded-md text-sm">
            {error}
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={activity.id} className="flex">
                <div className="mr-4 relative">
                  <div className={`w-2 h-2 rounded-full mt-2 ${getTypeColor(activity.type)}`} />
                  {i < activities.length - 1 && (
                    <div className="absolute top-3 bottom-0 left-1 w-[1px] bg-border"></div>
                  )}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm">{activity.text}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 