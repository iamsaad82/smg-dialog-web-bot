import { InteractiveElement } from "@/types/interactive";

// Typen für die strukturierten Inhalte
export type NumberedSection = { number: string; title: string; content: string };
export type BulletedSection = { title: string; items: string[] };

export type StructuredContent = 
  | { type: 'numbered'; sections: NumberedSection[] }
  | { type: 'bulleted'; sections: BulletedSection[] }
  | { type: 'simple'; text: string };

export interface LinkItem {
  url: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  interactiveElements?: InteractiveElement[];
}

export interface MessageItemProps {
  message: ChatMessage;
  primaryColor?: string;
  secondaryColor?: string;
} 