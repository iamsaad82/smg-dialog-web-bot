import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ChatEmbed from '../../components/ChatEmbed';
import { X } from 'lucide-react';

export default function FullscreenEmbed() {
  const router = useRouter();
  const { api_key, tenant_id, bot_name, primary_color, secondary_color } = router.query;
  const [config, setConfig] = useState<{
    apiKey?: string;
    tenantId?: string;
    botName?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }>({});

  useEffect(() => {
    // Parameter aus der URL extrahieren
    const newConfig: any = {};
    
    if (typeof api_key === 'string') newConfig.apiKey = api_key;
    if (typeof tenant_id === 'string') newConfig.tenantId = tenant_id;
    if (typeof bot_name === 'string') newConfig.botName = bot_name;
    if (typeof primary_color === 'string') newConfig.primaryColor = primary_color;
    if (typeof secondary_color === 'string') newConfig.secondaryColor = secondary_color;
    
    setConfig(newConfig);
  }, [api_key, tenant_id, bot_name, primary_color, secondary_color]);

  const handleClose = () => {
    // Nachricht an das übergeordnete Fenster senden
    if (window.parent) {
      window.parent.postMessage('ki-bot-close', '*');
    }
  };

  if (!config.apiKey && !config.tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Lade...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>KI-Bot | Vollbild-Chat</title>
        <meta name="description" content="KI-Bot Vollbild-Chat" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div 
          className="h-14 flex items-center justify-between px-4 shadow-sm"
          style={{ 
            backgroundColor: config.primaryColor || '#4f46e5',
            color: config.secondaryColor || '#ffffff'
          }}
        >
          <div className="font-medium">{config.botName || 'KI-Bot'}</div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Schließen"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Chat-Bereich */}
        <div className="flex-1 overflow-hidden">
          <ChatEmbed 
            apiKey={config.apiKey}
            tenantId={config.tenantId}
            botName={config.botName}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
            mode="fullscreen"
          />
        </div>
      </div>
    </>
  );
} 