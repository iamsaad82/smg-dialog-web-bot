import React, { useEffect, useState } from 'react';
import ChatContainer from './ChatContainer';
import { apiClient } from '../utils/api';
import { EmbedConfig } from '../types/api';

interface ChatEmbedProps {
  apiKey?: string;
  tenantId?: string;
  botName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  mode?: 'classic' | 'inline' | 'fullscreen';
}

const ChatEmbed: React.FC<ChatEmbedProps> = ({ 
  apiKey,
  tenantId,
  botName,
  primaryColor,
  secondaryColor,
  mode = 'classic'
}) => {
  const [config, setConfig] = useState<EmbedConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        
        // Wenn direkte Konfiguration übergeben wurde, diese verwenden
        if (botName && primaryColor) {
          setConfig({
            botName: botName,
            welcomeMessage: "Hallo! Wie kann ich Ihnen helfen?",
            primaryColor: primaryColor,
            secondaryColor: secondaryColor || "#ffffff",
            logoUrl: null
          });
          setError(null);
          setLoading(false);
          return;
        }
        
        // Ansonsten Konfiguration vom Server laden
        if (apiKey) {
          const embedConfig = await apiClient.getEmbedConfig(apiKey);
          setConfig(embedConfig);
          setError(null);
        } else if (tenantId) {
          // Hier könnte eine Funktion zum Laden der Konfiguration über die Tenant-ID implementiert werden
          // Für jetzt verwenden wir Standardwerte
          setConfig({
            botName: "KI-Bot",
            welcomeMessage: "Hallo! Wie kann ich Ihnen helfen?",
            primaryColor: "#4f46e5",
            secondaryColor: "#ffffff",
            logoUrl: null
          });
          setError(null);
        } else {
          throw new Error("Weder API-Key noch Tenant-ID vorhanden");
        }
      } catch (err) {
        console.error('Fehler beim Laden der Konfiguration:', err);
        setError('Fehler beim Laden der Bot-Konfiguration');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [apiKey, tenantId, botName, primaryColor, secondaryColor]);

  if (loading) {
    return (
      <div className={`${mode === 'classic' ? 'fixed bottom-6 right-6 z-50' : 'w-full'} p-4 bg-white rounded-lg shadow-lg flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className={`${mode === 'classic' ? 'fixed bottom-6 right-6 z-50' : 'w-full'} p-4 bg-white rounded-lg shadow-lg`}>
        <p className="text-red-500">{error || 'Konfiguration konnte nicht geladen werden'}</p>
      </div>
    );
  }

  return (
    <ChatContainer
      apiKey={apiKey}
      botName={config.botName}
      welcomeMessage={config.welcomeMessage}
      primaryColor={config.primaryColor}
      secondaryColor={config.secondaryColor}
      logoUrl={config.logoUrl}
      mode={mode}
    />
  );
};

export default ChatEmbed; 