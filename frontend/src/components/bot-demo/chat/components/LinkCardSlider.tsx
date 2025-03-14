import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { LinkItem } from '../utils/types';
import { LinkCard } from './LinkCard';

interface LinkCardSliderProps {
  links: LinkItem[];
}

export const LinkCardSlider = ({ links }: LinkCardSliderProps) => {
  // Wenn keine Links vorhanden sind, nichts rendern
  if (!links || links.length === 0) {
    return null;
  }
  
  // Für einen einzelnen Link, diesen direkt rendern ohne Slider
  if (links.length === 1) {
    return (
      <div className="my-2">
        <LinkCard url={links[0].url} title={links[0].title} />
      </div>
    );
  }
  
  // Zustand für den aktuellen Index
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Vorheriges und nächstes Link anzeigen
  const goToPrev = () => {
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex < 0 ? links.length - 1 : newIndex);
  };
  
  const goToNext = () => {
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex >= links.length ? 0 : newIndex);
  };
  
  // Direkter Zugriff auf einen Link
  const goToIndex = (index: number) => {
    if (index >= 0 && index < links.length) {
      setCurrentIndex(index);
    }
  };
  
  return (
    <div className="w-full space-y-2">
      <div className="relative">
        <LinkCard 
          key={currentIndex}
          url={links[currentIndex].url} 
          title={links[currentIndex].title} 
        />
        
        {/* Navigation-Buttons */}
        <div className="flex justify-between absolute top-1/2 -translate-y-1/2 w-full">
          <button 
            onClick={goToPrev}
            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none -ml-3"
            aria-label="Vorheriger Link"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <button 
            onClick={goToNext}
            className="w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none -mr-3"
            aria-label="Nächster Link"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Link-Zähler und Punkte */}
      <div className="flex justify-center items-center gap-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {currentIndex + 1} / {links.length}
        </div>
        
        {/* Punkte-Navigation - nur anzeigen, wenn mehr als 2 Links vorhanden sind */}
        {links.length > 2 && (
          <div className="flex gap-1.5">
            {links.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-2 h-2 rounded-full focus:outline-none ${
                  index === currentIndex 
                    ? 'bg-blue-500 dark:bg-blue-400'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
                aria-label={`Link ${index + 1} von ${links.length}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 