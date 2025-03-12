// Tenant-Typen
export interface Tenant {
  id: string;
  name: string;
  description?: string;
  contact_email?: string;
  api_key: string;
  bot_name: string;
  bot_welcome_message: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
  use_mistral: boolean;
  custom_instructions: string | null;
  created_at: string;
  updated_at: string;
  bot_message_bg_color?: string;
  bot_message_text_color?: string;
  user_message_bg_color?: string;
  user_message_text_color?: string;
}

export interface TenantCreate {
  name: string;
  description?: string;
  contact_email?: string;
  api_key?: string;
  custom_instructions?: string;
  bot_name?: string;
  bot_welcome_message?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  use_mistral?: boolean;
}

export interface TenantUpdate {
  name?: string;
  description?: string;
  contact_email?: string;
  custom_instructions?: string;
  bot_name?: string;
  bot_welcome_message?: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  use_mistral?: boolean;
}

// Dokument-Typen
export interface Document {
  id: string;
  tenant_id: string;
  title: string;
  content: string;
  source?: string;
  doc_metadata?: Record<string, any>;
  created_at: string;
}

export interface DocumentCreate {
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, any>;
  file?: File;
}

// Chat-Typen
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatQuery {
  messages: ChatMessage[];
  stream?: boolean;
  use_mistral?: boolean;
  custom_instructions?: string;
}

// Suchanfrage-Typen
export interface SearchQuery {
  query: string;
  limit?: number;
  hybrid_search?: boolean;
}

export interface SearchResult {
  title: string;
  content: string;
  source?: string;
  metadata?: Record<string, any>;
  _additional?: {
    certainty?: number;
  };
}

// Einbetten-Konfiguration
export interface EmbedConfig {
  botName: string;
  welcomeMessage: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
}

// API-Antwort-Typen
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export enum IndexStatus {
  INDIZIERT = "INDIZIERT",
  NICHT_INDIZIERT = "NICHT_INDIZIERT",
  FEHLER = "FEHLER"
}

export interface WeaviateStatus {
  status: IndexStatus;
  lastUpdated?: string;
  error?: string;
}

// Interaktive Elemente
export interface ContactLink {
  type: string; // 'appointment', 'website', 'map', 'email', 'phone'
  label: string;
  url: string;
}

export interface ContactInfo {
  id: string;
  name: string;
  type: string;
  address?: string;
  phone?: string;
  email?: string;
  hours?: string;
  links?: ContactLink[];
  keywords?: string[];
}

export interface InteractiveConfig {
  contacts: ContactInfo[];
}

// UI-Komponenten
export interface ComponentRule {
  id: string;
  component: string;
  triggers: string[];
  isEnabled: boolean;
  exampleFormat?: string;
  description?: string;
}

export interface UIComponentsConfig {
  prompt: string;
  rules: ComponentRule[];
  defaultExamples?: Record<string, string>;
}

export interface UIComponentDefinition {
  id: string;
  name: string;
  description: string | null;
  example_format: string;
  created_at: string;
  updated_at: string;
}

// Benutzer- und Rollen-Typen
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  agency_id: string | null;
  assigned_tenant_ids: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  ADMIN = "admin",
  AGENCY_ADMIN = "agency_admin",
  EDITOR = "editor",
  VIEWER = "viewer"
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  agency_id?: string;
  assigned_tenant_ids?: string[];
}

export interface UserUpdate {
  username?: string;
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: UserRole;
  agency_id?: string;
  assigned_tenant_ids?: string[];
  is_active?: boolean;
}

// Agentur-Typen
export interface Agency {
  id: string;
  name: string;
  description?: string;
  contact_email: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  website?: string;
  created_at: string;
  updated_at: string;
  managed_tenant_ids: string[];
}

export interface AgencyCreate {
  name: string;
  description?: string;
  contact_email: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  website?: string;
  managed_tenant_ids?: string[];
}

export interface AgencyUpdate {
  name?: string;
  description?: string;
  contact_email?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  website?: string;
  managed_tenant_ids?: string[];
}

// Erweiterte Tenant-Typen 
export interface TenantExtended extends Tenant {
  managing_agency?: Agency;
  assigned_editors?: User[];
} 