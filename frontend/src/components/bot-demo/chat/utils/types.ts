import { InteractiveElement } from "@/types/interactive";
import { StructuredData } from '../tenant-renderers/types';

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  interactiveElements?: InteractiveElement[];
}

/**
 * Erweiterte Chat-Nachricht mit strukturierten Daten
 * Diese wird für das Tenant-spezifische Rendering verwendet
 */
export interface ExtendedChatMessage extends ChatMessage {
  // Strukturierte Daten für spezielle Renderer
  structured_data?: StructuredData[];
}

export interface MessageItemProps {
  message: ChatMessage;
  primaryColor?: string;
  secondaryColor?: string;
} 