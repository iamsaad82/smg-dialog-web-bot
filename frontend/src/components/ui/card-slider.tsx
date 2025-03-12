import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CardSliderProps {
  children: React.ReactNode[];
  title?: string;
  itemsPerView?: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export const CardSlider: React.FC<CardSliderProps> = ({
  children,
  title,
  itemsPerView = 1,
  primaryColor = '#4f46e5',
  secondaryColor = '#ffffff',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [screenSize, setScreenSize] = useState('medium');
  
  // Wenn keine Kinder vorhanden sind, nichts rendern
  if (!children || children.length === 0) {
    return null;
  }
  
  // Responsive: Bildschirmgröße erkennen
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setScreenSize('small');
      } else if (width < 1024) {
        setScreenSize('medium');
      } else {
        setScreenSize('large');
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Effektive Anzahl der angezeigten Items basierend auf Bildschirmgröße
  const getEffectiveItemsPerView = () => {
    switch (screenSize) {
      case 'small':
        return 1;
      case 'medium':
        return Math.min(2, itemsPerView);
      case 'large':
        return itemsPerView;
      default:
        return itemsPerView;
    }
  };
  
  const effectiveItemsPerView = getEffectiveItemsPerView();
  
  // Wenn nur ein Kind, oder weniger als itemsPerView, dann direkt alle Kinder rendern
  if (children.length <= effectiveItemsPerView) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="text-lg font-medium mb-3" style={{ color: primaryColor }}>{title}</h3>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {children.map((child, index) => (
            <div key={index} className="w-full">
              {child}
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // Zum vorherigen Slide wechseln
  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, children.length - effectiveItemsPerView) : Math.max(0, prev - effectiveItemsPerView)
    );
  };
  
  // Zum nächsten Slide wechseln
  const nextSlide = () => {
    setCurrentIndex((prev) => 
      Math.min(children.length - effectiveItemsPerView, prev + effectiveItemsPerView)
    );
  };
  
  // Prüfen, ob es vorherige oder nächste Slides gibt
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < children.length - effectiveItemsPerView;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        {title && (
          <h3 className="text-lg font-medium" style={{ color: primaryColor }}>{title}</h3>
        )}
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={prevSlide}
            disabled={!hasPrev}
            style={{ 
              backgroundColor: hasPrev ? `${primaryColor}20` : 'transparent',
              color: hasPrev ? primaryColor : '#ccc'
            }}
          >
            <ChevronLeft size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={nextSlide}
            disabled={!hasNext}
            style={{ 
              backgroundColor: hasNext ? `${primaryColor}20` : 'transparent',
              color: hasNext ? primaryColor : '#ccc'
            }}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      
      {/* Slider-Container */}
      <div className="overflow-hidden w-full">
        <div 
          className="flex transition-transform duration-300 w-full"
          style={{
            transform: `translateX(-${currentIndex * 100 / effectiveItemsPerView}%)`,
            width: `${(children.length / effectiveItemsPerView) * 100}%`
          }}
        >
          {children.map((child, index) => (
            <div 
              key={index} 
              className="px-2" 
              style={{ 
                width: `${100 / (children.length / effectiveItemsPerView)}%`,
                flex: `0 0 ${100 / (children.length / effectiveItemsPerView)}%`
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>
      
      {/* Pagination Dots */}
      {children.length > effectiveItemsPerView && (
        <div className="flex justify-center mt-4 gap-1">
          {Array.from({ length: Math.ceil(children.length / effectiveItemsPerView) }).map((_, i) => {
            const isActive = i === Math.floor(currentIndex / effectiveItemsPerView);
            return (
              <button
                key={i}
                className="w-2 h-2 rounded-full transition-all"
                style={{ 
                  backgroundColor: isActive ? primaryColor : `${primaryColor}40`,
                  transform: isActive ? 'scale(1.2)' : 'scale(1)'
                }}
                onClick={() => setCurrentIndex(i * effectiveItemsPerView)}
                aria-label={`Gehe zu Slide ${i + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}; 