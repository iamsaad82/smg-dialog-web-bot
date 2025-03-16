import { useState, useCallback } from 'react';
import { toast } from '@/utils/toast';

interface UseProgressToastResult {
  startProgress: (message: string) => string;
  updateProgress: (id: string, message: string, percent?: number) => void;
  finishProgress: (id: string, message: string, type?: 'success' | 'error') => void;
}

/**
 * Hook für die Anzeige von Fortschritts-Toasts
 * 
 * @returns Funktionen zum Starten, Aktualisieren und Beenden von Fortschritts-Toasts
 */
export function useProgressToast(): UseProgressToastResult {
  const [toastIds, setToastIds] = useState<Record<string, string>>({});

  // Starte einen neuen Fortschritts-Toast
  const startProgress = useCallback((message: string): string => {
    const id = Date.now().toString();
    
    toast.loading(message, {
      id,
      duration: Infinity,
    });
    
    setToastIds(prev => ({ ...prev, [id]: id }));
    return id;
  }, []);

  // Aktualisiere einen bestehenden Fortschritts-Toast
  const updateProgress = useCallback((id: string, message: string, percent?: number) => {
    const percentText = percent !== undefined ? ` (${Math.round(percent)}%)` : '';
    
    toast.loading(`${message}${percentText}`, {
      id,
      duration: Infinity,
    });
  }, []);

  // Beende einen Fortschritts-Toast
  const finishProgress = useCallback((id: string, message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'success') {
      toast.success(message, { id });
    } else {
      toast.error(message, { id });
    }
    
    setToastIds(prev => {
      const newIds = { ...prev };
      delete newIds[id];
      return newIds;
    });
  }, []);

  return {
    startProgress,
    updateProgress,
    finishProgress
  };
} 