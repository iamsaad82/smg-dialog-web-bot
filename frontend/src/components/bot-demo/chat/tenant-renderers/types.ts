import React from 'react';

/**
 * Konfiguration für einen Tenant-Renderer
 */
export interface TenantRendererConfig {
  /** Eindeutige ID des Renderers */
  id: string;
  /** Anzeigename des Renderers */
  name: string;
  /** Beschreibung des Renderers */
  description: string;
  /** Unterstützte Content-Typen */
  contentTypes: string[];
  /** Standard-Renderer für unbekannte Content-Typen */
  defaultRenderer: React.ComponentType<TenantRendererProps>;
  /** Gibt an, ob dieser Renderer anpassbar ist */
  supportsCustomization: boolean;
}

/**
 * Strukturierte Daten, die vom Backend geliefert werden
 */
export interface StructuredData {
  /** Typ der strukturierten Daten (z.B. "school", "office", "event") */
  type: string;
  /** Die eigentlichen Daten */
  data: any;
}

/**
 * Props für Tenant-Renderer-Komponenten
 */
export interface TenantRendererProps {
  /** Die strukturierten Daten, die gerendert werden sollen */
  data: StructuredData;
  /** Optionale CSS-Klassen */
  className?: string;
}

/**
 * Registry für alle verfügbaren Renderer
 */
export interface RenderersRegistry {
  [tenantId: string]: {
    [contentType: string]: React.ComponentType<TenantRendererProps>;
  };
}

/**
 * Erweiterte ChatMessage mit strukturierten Daten
 */
export interface ExtendedChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  // Strukturierte Daten für spezielle Rendering
  structured_data?: StructuredData[];
} 