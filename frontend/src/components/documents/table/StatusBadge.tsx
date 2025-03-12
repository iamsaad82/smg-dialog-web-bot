import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { IndexStatus } from '@/types/api';

interface StatusBadgeProps {
  status: {
    status: IndexStatus;
    lastUpdated?: string;
    error?: string;
  };
}

/**
 * Komponente zur Anzeige des Dokumentenstatus
 */
export default function StatusBadge({ status }: StatusBadgeProps) {
  // Badge-Farbe und Icon basierend auf dem Status
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary';
  let icon = <Clock className="h-3 w-3 mr-1" />;
  let label = 'Nicht indiziert';

  switch (status.status) {
    case IndexStatus.INDIZIERT:
      badgeVariant = 'default';
      icon = <CheckCircle className="h-3 w-3 mr-1" />;
      label = 'Indiziert';
      break;
    case IndexStatus.NICHT_INDIZIERT:
      // Bei Fehlern während der Indizierung sieht Badge anders aus
      if (status.error && status.error.includes("Backend-Fehler")) {
        badgeVariant = 'outline';
        icon = <Loader2 className="h-3 w-3 mr-1 animate-spin" />;
        label = 'Backend-Problem';
      } else if (status.error && status.error.includes("Dokument nicht gefunden")) {
        badgeVariant = 'outline';
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        label = 'Nicht gefunden';
      } else if (status.error && status.error.includes("Netzwerkfehler")) {
        badgeVariant = 'outline';
        icon = <AlertTriangle className="h-3 w-3 mr-1" />;
        label = 'Netzwerkfehler';
      } else {
        badgeVariant = 'secondary';
        icon = <Clock className="h-3 w-3 mr-1" />;
        label = 'Nicht indiziert';
      }
      break;
    case IndexStatus.FEHLER:
      badgeVariant = 'destructive';
      icon = <AlertTriangle className="h-3 w-3 mr-1" />;
      label = 'Fehler';
      break;
    default:
      badgeVariant = 'outline';
      label = 'Unbekannt';
  }

  // Bei einem Fehler einen Tooltip mit der Fehlermeldung anzeigen
  if (status.error) {
    const errorMessage = status.error;
    const truncatedError = errorMessage.length > 100 
      ? errorMessage.substring(0, 100) + '...' 
      : errorMessage;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={badgeVariant} className="flex items-center">
              {icon}
              <span>{label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="max-w-xs">
              <p className="font-medium">Status: {label}</p>
              <p className="text-xs mt-1">Fehler: {truncatedError}</p>
              {status.lastUpdated && (
                <p className="text-xs mt-1">
                  Letzte Aktualisierung: {new Date(status.lastUpdated).toLocaleString('de-DE')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Status mit Tooltip für Zeitstempel
  if (status.lastUpdated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={badgeVariant} className="flex items-center">
              {icon}
              <span>{label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Letzte Aktualisierung: {new Date(status.lastUpdated).toLocaleString('de-DE')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Ohne Fehler oder Zeitstempel nur das Badge anzeigen
  return (
    <Badge variant={badgeVariant} className="flex items-center">
      {icon}
      <span>{label}</span>
    </Badge>
  );
} 