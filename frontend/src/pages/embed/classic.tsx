import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ChatEmbed from '../../components/ChatEmbed';

export default function ClassicEmbed() {
  const router = useRouter();
  const { api_key } = router.query;
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof api_key === 'string') {
      setApiKey(api_key);
    }
  }, [api_key]);

  if (!apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Lade...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>KI-Bot | Klassisches Widget</title>
        <meta name="description" content="KI-Bot klassisches Chat-Widget" />
      </Head>

      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl bg-white p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">KI-Bot Klassisches Widget</h1>
          <p className="text-gray-600 mb-4">
            Dies ist eine Demonstration des klassischen Chat-Widgets. Es erscheint als schwebende Schaltfläche in der unteren rechten Ecke.
          </p>
          <p className="text-gray-600 mb-4">
            Klicken Sie auf die Schaltfläche, um den Chat zu öffnen und mit dem Bot zu interagieren.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm font-mono">
              Einbettungscode:
            </p>
            <pre className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto mt-2 text-sm">
              {`<script src="https://your-domain.com/embed.js" data-api-key="${apiKey}" data-mode="classic"></script>`}
            </pre>
          </div>
        </div>

        <ChatEmbed apiKey={apiKey} mode="classic" />
      </div>
    </>
  );
} 