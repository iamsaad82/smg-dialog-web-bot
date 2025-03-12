import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LinkItem } from '../utils/types';
import { LinkCard } from './LinkCard';

interface LinkCardSliderProps {
  links: LinkItem[];
}

// Card-Slider für mehrere Links
export const LinkCardSlider = ({ links }: LinkCardSliderProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
      
      {links.length > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button 
            onClick={prevSlide}
            className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-xs text-gray-500">
            {currentIndex + 1} / {links.length}
          </div>
          <button 
            onClick={nextSlide}
            className="p-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}; 