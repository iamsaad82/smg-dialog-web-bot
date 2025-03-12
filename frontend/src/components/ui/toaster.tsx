import React from 'react';

// Verwenden Sie eine benutzerdefinierte, einfache Toaster-Komponente anstelle von Sonner,
// da im Docker-Container Probleme mit der Sonner-Import auftreten können
export function Toaster() {
  // Leere Komponente zurückgeben, da die Toasts mit der utils/toast.ts-Fallback
  // direkt über window.alert angezeigt werden, wenn Sonner nicht verfügbar ist
  return null;
}

// Diese Komponente ist ein Platzhalter, der aktiviert wird, wenn Sonner verfügbar ist
// Im Moment werden Benachrichtigungen als Fallback über window.alert angezeigt
// gemäß der Implementierung in utils/toast.ts 