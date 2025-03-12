interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

interface ChatLog {
  id: string;
  sessionId: string;
  clientInfo: string;
  startTime: string;
  duration: string;
  messageCount: number;
  topics?: string[];
  messages: ChatMessage[];
}

export const demoData = {
  chatLogs: [
    {
      id: "1",
      sessionId: "f7a32b91-c4d5-4e8c-b2f8-af6c12de3456",
      clientInfo: "Chrome / Windows",
      startTime: "Heute, 10:15 Uhr",
      duration: "15m 42s",
      messageCount: 12,
      topics: ["Produktfragen", "Bestellung", "Versand"],
      messages: [
        {
          id: "msg1",
          role: "user",
          content: "Hallo, ich habe Fragen zu meiner Bestellung.",
          timestamp: "10:15:23"
        },
        {
          id: "msg2",
          role: "assistant",
          content: "Guten Tag! Ich helfe Ihnen gerne bei Fragen zu Ihrer Bestellung. Haben Sie eine Bestellnummer, auf die Sie sich beziehen?",
          timestamp: "10:15:25"
        },
        {
          id: "msg3",
          role: "user",
          content: "Ja, die Bestellnummer ist #12345. Ich möchte wissen, wann meine Bestellung versandt wird.",
          timestamp: "10:16:12"
        },
        {
          id: "msg4",
          role: "assistant",
          content: "Vielen Dank für die Bestellnummer. Ich sehe, dass Ihre Bestellung #12345 derzeit verpackt wird und voraussichtlich morgen versandt wird. Die Lieferung sollte innerhalb von 2-3 Werktagen erfolgen.",
          timestamp: "10:16:15"
        },
        {
          id: "msg5",
          role: "user",
          content: "Kann ich noch ein Produkt zu meiner Bestellung hinzufügen?",
          timestamp: "10:17:30"
        },
        {
          id: "msg6",
          role: "assistant",
          content: "Da Ihre Bestellung bereits in der Verpackungsphase ist, können wir leider keine Produkte mehr hinzufügen. Sie können jedoch eine neue Bestellung aufgeben, und wir bieten kostenfreien Versand für Bestellungen über 50€.",
          timestamp: "10:17:33"
        }
      ]
    },
    {
      id: "2",
      sessionId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      clientInfo: "Firefox / Mac",
      startTime: "Gestern, 14:23 Uhr",
      duration: "8m 12s",
      messageCount: 7,
      topics: ["Rückgabe", "Erstattung"],
      messages: [
        {
          id: "msg1",
          role: "user",
          content: "Ich möchte ein Produkt zurückgeben. Wie funktioniert das?",
          timestamp: "14:23:05"
        },
        {
          id: "msg2",
          role: "assistant",
          content: "Für Rückgaben haben Sie 30 Tage Zeit nach Erhalt der Ware. Bitte nennen Sie mir Ihre Bestellnummer, damit ich Ihnen helfen kann.",
          timestamp: "14:23:10"
        }
      ]
    },
    {
      id: "3",
      sessionId: "z9y8x7w6-v5u4-t3s2-r1q0-p9o8n7m6l5k4",
      clientInfo: "Safari / iOS",
      startTime: "19.05.2023, 09:45 Uhr",
      duration: "23m 51s",
      messageCount: 18,
      topics: ["Technische Hilfe", "Produktnutzung"],
      messages: []
    },
    {
      id: "4",
      sessionId: "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
      clientInfo: "Edge / Windows",
      startTime: "15.05.2023, 16:30 Uhr",
      duration: "11m 05s",
      messageCount: 9,
      topics: ["Kundenkonto", "Passwort"],
      messages: []
    },
    {
      id: "5",
      sessionId: "a9b8c7d6-e5f4-g3h2-i1j0-k9l8m7n6o5p4",
      clientInfo: "Chrome / Android",
      startTime: "10.05.2023, 11:22 Uhr",
      duration: "4m 16s",
      messageCount: 5,
      topics: ["Artikelverfügbarkeit"],
      messages: []
    }
  ]
}; 