import React from 'react';
import { 
  InteractiveElement, 
  OpeningHoursTableElement,
  ContactCardElement,
  StoreMapElement,
  ProductShowcaseElement,
  InfoElement
} from '../types/interactive';

// UI-Komponenten
import OpeningHoursTable from '@/components/ui-components/OpeningHoursTable';
import ContactCard from '@/components/ui-components/ContactCard';
import StoreMap from '@/components/ui-components/StoreMap';
import ProductShowcase from '@/components/ui-components/ProductShowcase';

// Typ für den Komponenten-Registry-Eintrag
interface ComponentEntry {
  component: React.ComponentType<any>;
  propMapper: (element: any, primaryColor?: string, secondaryColor?: string) => any;
}

// Die Komponenten-Registry als Map
const componentRegistry = new Map<string, ComponentEntry>();

/**
 * Registriert eine Komponente in der Registry
 * 
 * @param type Der Typ der interaktiven Komponente
 * @param component Die React-Komponente
 * @param propMapper Eine Funktion, die ein InteractiveElement in Props für die Komponente umwandelt
 */
export function registerComponent(
  type: string, 
  component: React.ComponentType<any>, 
  propMapper: (element: any, primaryColor?: string, secondaryColor?: string) => any
) {
  componentRegistry.set(type, { component, propMapper });
}

/**
 * Ruft eine Komponente aus der Registry ab und rendert sie mit den entsprechenden Props
 * 
 * @param element Das interaktive Element mit Typ und Daten
 * @param key React Key für die Komponente
 * @param primaryColor Primärfarbe des Tenants
 * @param secondaryColor Sekundärfarbe des Tenants
 * @returns Eine React-Komponente oder null, wenn keine Komponente für den Typ registriert ist
 */
export function renderComponent(
  element: InteractiveElement, 
  key: React.Key,
  primaryColor?: string,
  secondaryColor?: string
): React.ReactNode {
  const entry = componentRegistry.get(element.type);
  
  if (!entry) {
    console.warn(`Keine Komponente für Typ '${element.type}' registriert`);
    return null;
  }
  
  const { component: Component, propMapper } = entry;
  const props = propMapper(element, primaryColor, secondaryColor);
  
  return React.createElement(Component, { key, ...props });
}

// Standardkomponenten registrieren
registerComponent('opening_hours_table', OpeningHoursTable, (element: OpeningHoursTableElement, primaryColor, secondaryColor) => ({
  data: element.data,
  title: element.title,
  description: element.description,
  primaryColor,
  secondaryColor
}));

registerComponent('contact_card', ContactCard, (element: ContactCardElement, primaryColor, secondaryColor) => ({
  contacts: element.contacts,
  title: element.title,
  description: element.description,
  layout: element.layout,
  showActions: element.showActions,
  primaryColor,
  secondaryColor
}));

registerComponent('store_map', StoreMap, (element: StoreMapElement, primaryColor, secondaryColor) => ({
  locations: element.locations,
  title: element.title,
  description: element.description,
  highlightedLocationId: element.highlightedLocationId,
  floorplan: element.floorplan,
  primaryColor,
  secondaryColor
}));

registerComponent('product_showcase', ProductShowcase, (element: ProductShowcaseElement, primaryColor, secondaryColor) => ({
  products: element.products,
  title: element.title,
  description: element.description,
  layout: element.layout,
  showDetailsButton: element.showDetailsButton,
  primaryColor,
  secondaryColor
}));

// Info-Komponente registrieren
// Da wir in einer TypeScript-Datei sind, können wir keine JSX verwenden
// Stattdessen erstellen wir eine separate Info-Komponente im ChatDemo
registerComponent('info', (props: any) => {
  return props.content;
}, (element: InfoElement) => ({
  content: element.content
}));

// Exportiere eine Liste aller registrierten Komponenten-Typen
export function getRegisteredComponentTypes(): string[] {
  return Array.from(componentRegistry.keys());
} 