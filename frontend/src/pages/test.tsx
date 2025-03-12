import React from 'react';
import { MessageItem } from '@/components/bot-demo/chat/MessageItem';
import { ChatMessage } from '@/components/bot-demo/chat/utils/types';

export default function TestPage() {
  const testMessages: ChatMessage[] = [
    {
      id: '1',
      role: 'user' as const,
      content: 'Hallo, ich brauche Informationen über verschiedene Hauttypen.',
      timestamp: '10:30'
    },
    {
      id: '2',
      role: 'assistant' as const,
      content: 'Hier sind die **wichtigsten Hauttypen**:\n\n1. **Normale Haut**: Ausgeglichen, weder zu trocken noch zu fettig. Die ideale Haut mit feinen Poren und gutem Feuchtigkeitsgehalt.\n\n2. **Trockene Haut**: Spannt oft, kann schuppig sein und neigt zu Rötungen. Benötigt intensive Feuchtigkeit.\n\n3. **Fettige Haut**: Glänzt übermäßig, hat vergrößerte Poren und neigt zu Unreinheiten. Braucht spezielle Reinigung.\n\n4. **Mischhaut**: Kombiniert fettige Bereiche (meist T-Zone) mit trockenen Wangen. Erfordert zonenbezogene Pflege.\n\nhttps://www.example.com/hauttypen',
      timestamp: '10:31'
    },
    {
      id: '3',
      role: 'user' as const,
      content: 'Und was ist mit empfindlicher Haut?',
      timestamp: '10:32'
    },
    {
      id: '4',
      role: 'assistant' as const,
      content: 'Empfindliche Haut ist ein weiterer wichtiger Hauttyp:\n\n**Empfindliche Haut**: Reagiert schnell mit Rötungen, Brennen oder Juckreiz auf externe Faktoren wie:\n• Temperaturwechsel\n• Bestimmte Inhaltsstoffe\n• Umwelteinflüsse\n• Stress\n\nPflegetipps für empfindliche Haut:\n• Produkte ohne Parfüm und Alkohol verwenden\n• Sanfte, reizfreie Reinigung\n• Hautbarriere stärken mit beruhigenden Wirkstoffen\n• Sonnenschutz ist besonders wichtig\n\nhttps://www.example.com/empfindliche-haut',
      timestamp: '10:33'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Test Chat</h1>
      <div className="space-y-4">
        {testMessages.map((message) => (
          <MessageItem 
            key={message.id} 
            message={message} 
            primaryColor="#10b981"
            secondaryColor="#ffffff"
          />
        ))}
      </div>
    </div>
  );
} 