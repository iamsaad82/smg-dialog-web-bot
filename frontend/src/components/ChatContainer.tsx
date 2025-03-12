import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { ChatMessage as ChatMessageType } from '../types/api';
import { InteractiveElement } from '../types/interactive';
import { apiClient } from '../utils/api';
import { parseBotResponse } from '../utils/botResponseParser';
import { Box, Flex } from '@chakra-ui/react';

interface ChatContainerProps {
  apiKey?: string;
  botName?: string;
  welcomeMessage?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  mode?: 'classic' | 'inline' | 'fullscreen';
  useMistral?: boolean;
  customInstructions?: string;
  botMessageBgColor?: string;
  botMessageTextColor?: string;
  userMessageBgColor?: string;
  userMessageTextColor?: string;
}

interface MessageWithInteractiveElements {
  message: ChatMessageType;
  interactiveElements: InteractiveElement[];
}

const ChatContainer: React.FC<ChatContainerProps> = ({
  apiKey,
  botName = 'KI-Assistent',
  welcomeMessage = 'Hallo! Wie kann ich Ihnen helfen?',
  primaryColor = '#4f46e5',
  secondaryColor = '#ffffff',
  logoUrl = null,
  mode = 'classic',
  useMistral = false,
  customInstructions,
  botMessageBgColor = '#374151',
  botMessageTextColor = '#ffffff',
  userMessageBgColor = '#4f46e5',
  userMessageTextColor = '#ffffff'
}) => {
  // Verwenden eines Refs für die aktuelle Bot-Antwort während des Streamings
  const currentAssistantMessageRef = useRef<string>('');
  const interactiveElementsRef = useRef<InteractiveElement[]>([]);
  
  const [messagesWithElements, setMessagesWithElements] = useState<MessageWithInteractiveElements[]>([
    { 
      message: { role: 'assistant', content: welcomeMessage },
      interactiveElements: []
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOpen, setIsOpen] = useState(mode === 'inline');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll zum Ende der Nachrichten
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messagesWithElements]);

  // CSS-Variablen für Chat-Farben setzen
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', primaryColor);
    root.style.setProperty('--message-bot-bg', botMessageBgColor);
    root.style.setProperty('--message-bot-text', botMessageTextColor);
    root.style.setProperty('--message-user-bg', userMessageBgColor);
    root.style.setProperty('--message-user-text', userMessageTextColor);
  }, [primaryColor, botMessageBgColor, botMessageTextColor, userMessageBgColor, userMessageTextColor]);

  // Framer Motion Animationsvarianten
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.3
      }
    }
  };

  // Nachricht senden
  const handleSendMessage = async (content: string) => {
    // Benutzernachricht hinzufügen
    const userMessage: ChatMessageType = { role: 'user', content };
    setMessagesWithElements(prev => [
      ...prev, 
      { message: userMessage, interactiveElements: [] }
    ]);
    
    // Streaming-Zustand zurücksetzen
    currentAssistantMessageRef.current = '';
    interactiveElementsRef.current = [];
    setIsTyping(true);

    // Assistentennachricht vorbereitend hinzufügen
    setMessagesWithElements(prev => [
      ...prev,
      { 
        message: { role: 'assistant', content: '' },
        interactiveElements: [] 
      }
    ]);

    try {
      // Alle Nachrichten für den Kontext senden (ohne die leere Assistentennachricht)
      const chatMessages = messagesWithElements.map(item => item.message).filter(msg => msg.content !== '');
      
      apiClient.getCompletionStream(
        {
          messages: [...chatMessages, userMessage],
          stream: true,
          use_mistral: useMistral,
          custom_instructions: customInstructions
        },
        (chunk) => {
          // Aktuellen Text aktualisieren
          currentAssistantMessageRef.current += chunk;
          
          // Versuch, auch während des Streamings JSON zu erkennen und zu parsen
          try {
            // Prüfen, ob die aktuelle Nachricht ein komplettes JSON-Objekt enthält
            const currentText = currentAssistantMessageRef.current;
            
            if (currentText.trim().startsWith('{') && currentText.trim().endsWith('}')) {
              // Versuchen, das JSON zu parsen
              const { text, interactiveElements } = parseBotResponse(currentText);
              
              // Wenn interaktive Elemente gefunden wurden, speichern
              if (interactiveElements && interactiveElements.length > 0) {
                interactiveElementsRef.current = interactiveElements;
                
                // Text aktualisieren (ohne JSON)
                setMessagesWithElements(prev => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  
                  if (lastIndex >= 0 && newMessages[lastIndex].message.role === 'assistant') {
                    newMessages[lastIndex] = {
                      message: { 
                        role: 'assistant', 
                        content: text 
                      },
                      interactiveElements: interactiveElements
                    };
                  }
                  
                  return newMessages;
                });
                return; // Nicht mehr als normalen Text behandeln
              }
            }
          } catch (error) {
            // Fehler beim JSON-Parsen ignorieren und als normalen Text behandeln
            console.log("Kein vollständiges/gültiges JSON während Streaming, behandle als Text");
          }
          
          // Wenn kein gültiges JSON erkannt wurde, als normalen Text behandeln
          setMessagesWithElements(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            
            if (lastIndex >= 0 && newMessages[lastIndex].message.role === 'assistant') {
              newMessages[lastIndex] = {
                message: { 
                  role: 'assistant', 
                  content: currentAssistantMessageRef.current 
                },
                interactiveElements: interactiveElementsRef.current
              };
            }
            
            return newMessages;
          });
        },
        () => {
          // Streaming abgeschlossen - jetzt können wir versuchen, die Komponenten zu extrahieren
          setIsTyping(false);
          
          // Versuchen, Komponenten aus der vollständigen Antwort zu extrahieren
          try {
            const { text, interactiveElements } = parseBotResponse(currentAssistantMessageRef.current);
            
            // Wenn Komponenten erkannt wurden, aktualisieren wir die letzte Nachricht
            if (interactiveElements && interactiveElements.length > 0) {
              console.log("UI-Komponenten erkannt:", interactiveElements);
              interactiveElementsRef.current = interactiveElements;
              
              // Nachricht mit extrahierten Komponenten und bereinigtem Text aktualisieren
              setMessagesWithElements(prev => {
                const newMessages = [...prev];
                const lastIndex = newMessages.length - 1;
                
                if (lastIndex >= 0 && newMessages[lastIndex].message.role === 'assistant') {
                  newMessages[lastIndex] = {
                    message: { 
                      role: 'assistant', 
                      content: text  // Bereinigter Text ohne JSON
                    },
                    interactiveElements: interactiveElements
                  };
                }
                
                return newMessages;
              });
            }
          } catch (error) {
            console.error("Fehler beim Parsen der UI-Komponenten:", error);
          }
          
          // Log für Debugging
          console.log("Streaming abgeschlossen, finale Nachricht:", currentAssistantMessageRef.current);
          console.log("Interaktive Elemente:", interactiveElementsRef.current);
        },
        (error) => {
          console.error("Fehler beim Chat:", error);
          setIsTyping(false);
          
          // Fehlermeldung anzeigen
          setMessagesWithElements(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            
            if (lastIndex >= 0 && newMessages[lastIndex].message.role === 'assistant' && 
                newMessages[lastIndex].message.content === '') {
              // Leere Assistentennachricht durch Fehlermeldung ersetzen
              newMessages[lastIndex] = {
                message: { 
                  role: 'assistant', 
                  content: 'Es tut mir leid, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.' 
                },
                interactiveElements: []
              };
            } else {
              // Neue Fehlermeldung hinzufügen
              newMessages.push({
                message: { 
                  role: 'assistant', 
                  content: 'Es tut mir leid, es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.' 
                },
                interactiveElements: []
              });
            }
            
            return newMessages;
          });
        },
        (elements) => {
          // Interaktive Elemente empfangen
          console.log("Interaktive Elemente empfangen:", elements);
          interactiveElementsRef.current = elements;
          
          // Sofort die aktuelle Assistentennachricht aktualisieren
          setMessagesWithElements(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            
            if (lastIndex >= 0 && newMessages[lastIndex].message.role === 'assistant') {
              newMessages[lastIndex] = {
                message: { 
                  role: 'assistant', 
                  content: currentAssistantMessageRef.current 
                },
                interactiveElements: elements
              };
            }
            
            return newMessages;
          });
        }
      );
    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error);
      setIsTyping(false);
    }
  };

  if (mode === 'classic' && !isOpen) {
    // Chat-Button, wenn nicht geöffnet
    return (
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-xl bg-brand-500 text-white flex items-center justify-center z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`${mode === 'classic' ? 'fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50' : 'w-full h-[600px]'} bg-white dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col`}
      style={{ 
        borderColor: primaryColor,
        borderWidth: '1px'
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <Flex 
        p={4} 
        alignItems="center" 
        justifyContent="space-between"
        bg={primaryColor}
      >
        <Flex alignItems="center">
          {logoUrl ? (
            <Box as="img" src={logoUrl} alt={botName} w={8} h={8} rounded="full" mr={2} />
          ) : (
            <Flex
              w={8}
              h={8}
              rounded="full"
              mr={2}
              alignItems="center"
              justifyContent="center"
              bg={primaryColor}
              color="white"
              fontWeight="bold"
            >
              {botName.charAt(0).toUpperCase()}
            </Flex>
          )}
          <Box as="h3" color="white" fontWeight="medium">{botName}</Box>
        </Flex>
        
        {mode === 'classic' && (
          <Box
            as="button"
            color="white"
            _hover={{ color: 'gray.200' }}
            onClick={() => setIsOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Box>
        )}
      </Flex>
      
      {/* Nachrichten */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messagesWithElements.map((item, index) => (
          <ChatMessage 
            key={index} 
            message={item.message} 
            botName={botName}
            botColor={primaryColor}
            index={index}
            interactiveElements={item.interactiveElements}
            botMessageBgColor={botMessageBgColor}
            botMessageTextColor={botMessageTextColor}
            userMessageBgColor={userMessageBgColor}
            userMessageTextColor={userMessageTextColor}
          />
        ))}
        
        {isTyping && (
          <Box p={2} bg="gray.100" rounded="lg" display="inline-block">
            <Flex gap={1}>
              <Box className="typing-dot"></Box>
              <Box className="typing-dot" style={{ animationDelay: '0.2s' }}></Box>
              <Box className="typing-dot" style={{ animationDelay: '0.4s' }}></Box>
            </Flex>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Eingabe */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <ChatInput 
          onSend={handleSendMessage} 
          disabled={isTyping}
          primaryColor={primaryColor}
          placeholder="Schreiben Sie eine Nachricht..."
          floating={false}
        />
      </div>
    </motion.div>
  );
};

export default ChatContainer; 