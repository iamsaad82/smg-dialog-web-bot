import React, { useEffect, useState } from 'react';
import { Users, FileText, MessageSquare, PuzzleIcon, DollarSign } from 'lucide-react';
import { StatCard } from './StatCard';
import { apiClient } from '@/utils/api';

// API-Typen für die Statistiken
interface SystemStats {
  tenantsCount: number;
  documentsCount: number;
  chatSessionsCount: number;
  componentsCount: number;
  apiCosts?: number;
  apiCostsLastMonth?: number;
  newTenantsLastMonth?: number;
  newDocumentsLastWeek?: number;
  averageChatsPerHour?: number;
}

export function StatsHeader() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Hier sollten die echten Daten von der API kommen
        // Im Echtsystem würde hier eine API-Anfrage stehen
        // apiClient.getSystemStats() o.ä.
        
        // Simulierte API-Antwort für den Prototyp
        // TODO: Durch echten API-Aufruf ersetzen
        const data: SystemStats = {
          tenantsCount: 12,
          documentsCount: 1248,
          chatSessionsCount: 842,
          componentsCount: 57,
          apiCosts: 436.72,
          apiCostsLastMonth: 158.45,
          newTenantsLastMonth: 2,
          newDocumentsLastWeek: 156,
          averageChatsPerHour: 35
        };

        // Kurze Verzögerung simulieren, um Ladeanimation zu zeigen
        setTimeout(() => {
          setStats(data);
          setError(null);
          setIsLoading(false);
        }, 800);
      } catch (err) {
        console.error("Fehler beim Laden der Systemstatistiken:", err);
        setError("Fehler beim Laden der Statistiken");
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard 
        title="Aktive Kunden" 
        value={stats?.tenantsCount || 0}
        description={stats?.newTenantsLastMonth ? `+${stats.newTenantsLastMonth} im letzten Monat` : undefined}
        icon={Users}
        isLoading={isLoading}
      />
      
      <StatCard 
        title="Indexierte Dokumente" 
        value={stats?.documentsCount || 0}
        description={stats?.newDocumentsLastWeek ? `+${stats.newDocumentsLastWeek} in den letzten 7 Tagen` : undefined}
        icon={FileText}
        isLoading={isLoading}
      />
      
      <StatCard 
        title="Chat-Sessions" 
        value={stats?.chatSessionsCount || 0}
        description={stats?.averageChatsPerHour ? `Heute (Ø ${stats.averageChatsPerHour}/Stunde)` : undefined}
        icon={MessageSquare}
        isLoading={isLoading}
      />
      
      <StatCard 
        title="UI-Komponenten" 
        value={stats?.componentsCount || 0}
        description="Aktive Instances über alle Kunden"
        icon={PuzzleIcon}
        isLoading={isLoading}
      />
      
      <StatCard 
        title="API-Kosten" 
        value={stats?.apiCosts ? `${stats.apiCosts.toFixed(2)} €` : "0,00 €"}
        description={stats?.apiCostsLastMonth ? `${stats.apiCostsLastMonth.toFixed(2)} € im letzten Monat` : undefined}
        icon={DollarSign}
        isLoading={isLoading}
      />
    </div>
  );
} 