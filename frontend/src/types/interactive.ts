/**
 * Typen für interaktive Elemente in Chatbot-Antworten.
 */

// Standortinformation für StoreMap
export interface Location {
  id: string;
  name: string;
  description?: string;
  floor?: string | number;
  coordinates?: {
    x: number;
    y: number;
  };
  category?: string;
}

// Produktinformation für ProductShowcase
export interface Product {
  id: string;
  name: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  discountPrice?: string;
  categories?: string[];
  shopName?: string;
  floor?: string | number;
  availability?: 'in-stock' | 'limited' | 'out-of-stock';
  url?: string;
}

// Kontaktinformation für ContactCard
export interface ContactInfo {
  id: string;
  name: string;
  title?: string;
  imageUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
  tags?: string[];
  links?: {
    type: 'website' | 'appointment' | 'map' | 'email' | 'phone';
    label: string;
    url: string;
  }[];
  social?: {
    platform: string;
    url: string;
  }[];
  rating?: {
    score: number;
    max: number;
    reviews?: number;
  };
}

// UI-Komponenten Typen
export type InteractiveElementType = 'button' | 'link' | 'info' | 'opening_hours_table' | 'store_map' | 'product_showcase' | 'contact_card';

export interface BaseInteractiveElement {
  type: InteractiveElementType;
  label?: string;
}

export interface ButtonElement extends BaseInteractiveElement {
  type: 'button';
  label: string;
  action?: string;
}

export interface LinkElement extends BaseInteractiveElement {
  type: 'link';
  label: string;
  url: string;
}

export interface InfoElement extends BaseInteractiveElement {
  type: 'info';
  content: string;
}

// Neue UI-Komponente: OpeningHoursTable
export interface OpeningHoursTableElement extends BaseInteractiveElement {
  type: 'opening_hours_table';
  title?: string;
  description?: string;
  data: {
    [key: string]: { open: string; close: string } | { closed: boolean };
  };
}

// Neue UI-Komponente: StoreMap
export interface StoreMapElement extends BaseInteractiveElement {
  type: 'store_map';
  title?: string;
  description?: string;
  locations: Location[];
  highlightedLocationId?: string;
  floorplan?: string;
}

// Neue UI-Komponente: ProductShowcase
export interface ProductShowcaseElement extends BaseInteractiveElement {
  type: 'product_showcase';
  title?: string;
  description?: string;
  products: Product[];
  layout?: 'grid' | 'list';
  showDetailsButton?: boolean;
}

// Neue UI-Komponente: ContactCard
export interface ContactCardElement extends BaseInteractiveElement {
  type: 'contact_card';
  title?: string;
  description?: string;
  contacts: ContactInfo[];
  layout?: 'grid' | 'list';
  showActions?: boolean;
}

export type InteractiveElement = 
  | ButtonElement 
  | LinkElement 
  | InfoElement 
  | OpeningHoursTableElement
  | StoreMapElement
  | ProductShowcaseElement
  | ContactCardElement;

// Interaktive Konfiguration für einen Tenant
export interface InteractiveConfig {
  contacts: ContactInfo[];
}

// API-Antwort mit interaktiven Elementen
export interface InteractiveResponse {
  text: string;
  interactive_elements?: InteractiveElement[];
}

// Bot-Antwortstruktur mit UI-Komponenten
export interface BotComponentResponse {
  text: string;
  component?: string;
  data?: any;
} 