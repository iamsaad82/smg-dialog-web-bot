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