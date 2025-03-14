import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Link, ExternalLink } from 'lucide-react';
import { LinkItem } from '../utils/types';
import { LinkCard } from './LinkCard';

interface LinkCardSliderProps {
  links: LinkItem[];
}

// Card-Slider für mehrere Links - verbesserte Version
export const LinkCardSlider = ({ links }: LinkCardSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Wenn keine Links vorhanden, nichts anzeigen
  if (!links || links.length === 0) {
    return null;
  }
  
  // Spezielle Anzeige für den Fall, dass nur ein Link vorhanden ist
  if (links.length === 1) {
    return <LinkCard url={links[0].url} title={links[0].title} />;
  }
  
  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % links.length);
  };
  
  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + links.length) % links.length);
  };
  
  return (
    <div className="relative mt-3">
      <div className="overflow-hidden">
        <div className="relative">
          <LinkCard url={links[currentIndex].url} title={links[currentIndex].title} />
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-2">
        <button 
          onClick={prevSlide}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Vorheriger Link"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="flex items-center">
          <Link className="h-4 w-4 text-blue-500 mr-2" />
          <span className="text-xs text-gray-600 dark:text-gray-300">
            {currentIndex + 1} von {links.length} Links
          </span>
        </div>
        
        <button 
          onClick={nextSlide}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Nächster Link"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      
      {/* Link-Punkte für schnelle Navigation */}
      {links.length > 2 && (
        <div className="flex justify-center mt-1 space-x-1">
          {links.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Zu Link ${index + 1} springen`}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex 
                  ? 'bg-blue-500 dark:bg-blue-400' 
                  : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}; 