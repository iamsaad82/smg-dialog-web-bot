/**
 * Typen für Brandenburg-spezifische Daten
 */

/**
 * Schuldaten für Brandenburg
 */
export interface BrandenburgSchool {
  name: string;
  type: string;
  schoolId?: string;
  address?: string;
  management?: string; // Schulleitung
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  details?: {
    allDayCare?: boolean; // Ganztagsschule
    additionalInfo?: string;
  };
}

/**
 * Amtsdaten für Brandenburg
 */
export interface BrandenburgOffice {
  name: string;
  department?: string;
  address?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  openingHours?: string;
  services?: string[];
}

/**
 * Veranstaltungsdaten für Brandenburg
 */
export interface BrandenburgEvent {
  title: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  organizer?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

/**
 * Dienstleistungsdaten für Brandenburg
 */
export interface BrandenburgService {
  name: string;
  link?: string;
  office?: string;
  isPaid?: boolean;
  isOnline?: boolean;
  description?: string;
}

/**
 * Ortsrechtdaten für Brandenburg
 */
export interface BrandenburgLocalLaw {
  title: string;
  link?: string;
  description?: string;
  text?: string;
}

/**
 * Kindergartendaten für Brandenburg
 */
export interface BrandenburgKindergarten {
  name: string;
  link?: string;
  address?: string;
  openingHours?: string;
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

/**
 * Webseiten-Daten für Brandenburg
 */
export interface BrandenburgWebpage {
  title: string;
  url?: string;
  content?: string;
}

/**
 * Entsorgungsdaten für Brandenburg
 */
export interface BrandenburgWasteManagement {
  name: string;
  description?: string;
} 