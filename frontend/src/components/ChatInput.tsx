import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  primaryColor?: string;
  autoFocus?: boolean;
  floating?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Schreiben Sie eine Nachricht...',
  primaryColor = '#4f46e5',
  autoFocus = true,
  floating = true
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const buttonColor = primaryColor || '#4f46e5';

  // Auto-Fokus, wenn die Komponente geladen wird
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Framer Motion Varianten für Animationen
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: 'spring', 
        stiffness: 500, 
        damping: 30 
      }
    }
  };

  // Schatten-Effekt mit der primären Farbe
  const shadowStyle = {
    boxShadow: `0 0 15px rgba(${parseInt(buttonColor.slice(1, 3), 16)}, ${parseInt(buttonColor.slice(3, 5), 16)}, ${parseInt(buttonColor.slice(5, 7), 16)}, 0.3)`
  };

  const containerStyle = floating 
    ? { ...shadowStyle } 
    : {};

  return (
    <motion.div
      className={`relative w-full ${floating ? 'floating-input' : 'mt-4'}`}
      style={containerStyle}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-full border border-gray-300 dark:border-gray-700 overflow-hidden">
        <TextareaAutosize
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full py-3 px-4 outline-none resize-none bg-transparent text-gray-900 dark:text-white"
          maxRows={4}
        />
        <motion.button
          className="absolute right-2 p-2 rounded-full"
          style={{ backgroundColor: buttonColor }}
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
        >
          <PaperAirplaneIcon className="h-5 w-5 text-white" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ChatInput; 