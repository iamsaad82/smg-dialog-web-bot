import React from 'react';
import { motion } from 'framer-motion';
import { ChatMessage as ChatMessageType } from '../types/api';
import { InteractiveElement } from '../types/interactive';
import InteractiveElementRenderer from './interactive/InteractiveElementRenderer';
import { Box, Flex, Text } from '@chakra-ui/react';
import { renderFormattedContent } from './bot-demo/chat/utils/rendering';

// Custom CSS für die richtige Textformatierung
const markdownStyles = {
  whiteSpace: 'pre-wrap' as const,  // Ändere zu pre-wrap, um alle Leerzeichen zu behalten
  wordBreak: 'break-word' as const, // Verhindert, dass Wörter über den Container hinausragen
};

interface ChatMessageProps {
  message: ChatMessageType;
  botName?: string;
  botColor?: string;
  index: number;
  interactiveElements?: InteractiveElement[];
  // Neue Farboptionen für Chat-Bubbles
  botMessageBgColor?: string;
  botMessageTextColor?: string;
  userMessageBgColor?: string;
  userMessageTextColor?: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  botName = 'KI-Assistent',
  botColor = '#4f46e5',
  index,
  interactiveElements = [],
  // Standardwerte für die neuen Farboptionen
  botMessageBgColor = '#374151',
  botMessageTextColor = '#ffffff',
  userMessageBgColor = '#4f46e5',
  userMessageTextColor = '#ffffff'
}) => {
  const isUser = message.role === 'user';
  
  // Vorverarbeitung des Nachrichtentexts für Bot-Nachrichten
  const processedContent = React.useMemo(() => {
    // Trimmen Sie den Text, um unerwünschte Leerzeichen zu entfernen
    return message.content.trim();
  }, [message.content, isUser]);
  
  // Animation-Varianten
  const variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        type: 'spring',
        stiffness: 500,
        damping: 30
      }
    })
  };

  // Stil für Bot-Nachrichten anhand der übergebenen Farben anpassen
  const messageStyle = isUser 
    ? {
        backgroundColor: userMessageBgColor,
        color: userMessageTextColor
      }
    : {
        backgroundColor: botMessageBgColor,
        color: botMessageTextColor,
        borderLeft: `3px solid ${botColor}`
      };

  return (
    <motion.div
      style={{
        display: 'flex',
        alignItems: 'start',
        marginBottom: '1rem',
        justifyContent: isUser ? 'flex-end' : 'flex-start'
      }}
      initial="hidden"
      animate="visible"
      custom={index}
      variants={variants}
    >
      {!isUser && (
        <Flex
          flexShrink={0}
          w={8}
          h={8}
          rounded="full"
          mr={2}
          alignItems="center"
          justifyContent="center"
          bg={botColor}
          color="white"
          fontSize="sm"
          fontWeight="medium"
        >
          {botName.charAt(0).toUpperCase()}
        </Flex>
      )}
      
      <Flex direction="column" maxW="80%">
        <Box
          bg={isUser ? userMessageBgColor : botMessageBgColor}
          color={isUser ? userMessageTextColor : botMessageTextColor}
          borderRadius="lg"
          borderTopLeftRadius={!isUser ? 0 : undefined}
          borderTopRightRadius={isUser ? 0 : undefined}
          borderLeftWidth={!isUser ? '3px' : undefined}
          borderLeftColor={!isUser ? botColor : undefined}
          overflow="hidden" // Verhindert, dass Inhalte überlaufen
        >
          <Box p={3}>
            {isUser ? (
              <Text>{processedContent}</Text>
            ) : (
              <Box
                className="prose prose-sm max-w-none dark:prose-invert"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  '& a': {
                    color: 'inherit',
                    textDecoration: 'underline',
                    _hover: {
                      opacity: 0.8
                    }
                  }
                }}
              >
                {renderFormattedContent(processedContent)}
              </Box>
            )}
          </Box>
        </Box>
        
        {/* Interaktive Elemente nur für Bot-Nachrichten anzeigen */}
        {!isUser && interactiveElements && interactiveElements.length > 0 && (
          <InteractiveElementRenderer 
            elements={interactiveElements}
            primaryColor={botColor}
          />
        )}
      </Flex>
      
      {isUser && (
        <Flex
          flexShrink={0}
          w={8}
          h={8}
          rounded="full"
          ml={2}
          bg="brand.500"
          alignItems="center"
          justifyContent="center"
          color="white"
          fontSize="sm"
          fontWeight="medium"
        >
          B
        </Flex>
      )}
    </motion.div>
  );
};

export default ChatMessage; 