import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ChatEmbed from '../../components/ChatEmbed';

export default function InlineEmbed() {
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
        <title>KI-Bot | Inline-Widget</title>
        <meta name="description" content="KI-Bot Inline-Chat-Widget" />
      </Head>

      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">KI-Bot Inline-Widget</h1>
          <p className="text-gray-600 mb-4">
            Dies ist eine Demonstration des Inline-Chat-Widgets. Es ist direkt in den Inhalt der Seite eingebettet.
          </p>
          <p className="text-gray-600 mb-4">
            Dieses Widget eignet sich besonders gut für Hilfeseiten, FAQs oder Support-Bereiche.
          </p>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm font-mono">
              Einbettungscode:
            </p>
            <pre className="bg-gray-800 text-white p-3 rounded-md overflow-x-auto mt-2 text-sm">
              {`<script src="https://your-domain.com/embed.js" data-api-key="${apiKey}" data-mode="inline" data-container-id="chat-container"></script>
<div id="chat-container"></div>`}
            </pre>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Chat-Widget</h2>
          <ChatEmbed apiKey={apiKey} mode="inline" />
        </div>
      </div>
    </>
  );
}