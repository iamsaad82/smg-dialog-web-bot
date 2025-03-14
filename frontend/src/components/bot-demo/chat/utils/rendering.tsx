import React from 'react';
import { formatTextWithBoldTitle } from './formatting';
import { formatTextWithBoldReact as formatTextWithBold } from './formatters';
import { NumberedStructuredContent } from '../components/NumberedStructuredContent';
import { StructuredContent } from '../components/StructuredContent';
import { LinkCardSlider } from '../components/LinkCardSlider';
import { LinkItem } from './types';

/**
 * Rendert strukturierten oder einfachen Text mit entsprechender Formatierung
 */
export const renderFormattedContent = (content: string) => {
  // Whitespace am Anfang und Ende des Inhalts trimmen
  const trimmedContent = content.trim();
  
  return formatTextWithBoldTitle(
    trimmedContent,
    // Render für nummerierte Listen - einfacher, klarer Stil
    (sections, introText, links) => (
      <div className="space-y-2 w-full">
        {/* Nummerierte Abschnitte */}
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-sm mr-2">
                  {section.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{section.title.endsWith(':') ? section.title.slice(0, -1) : section.title}</h3>
                  {section.content && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {formatTextWithBold(section.content.trim())}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    
    // Render für Aufzählungslisten - einfacher, klarer Stil
    (sections, introText, links) => (
      <div className="space-y-2 w-full">
        {/* Aufzählungen */}
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              {section.title && (
                <h3 className="text-sm font-medium mb-2">
                  {section.title.endsWith(':') ? section.title.slice(0, -1) : section.title}
                </h3>
              )}
              
              <ul className="space-y-1">
                {section.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex text-sm">
                    <span className="text-blue-500 mr-2">•</span>
                    <span className="text-gray-700 dark:text-gray-300">{item.trim()}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    
    // Render für einfachen Text - unkomplizierte Textdarstellung
    (text, links) => (
      <div className="w-full">
        {/* Einfacher Text */}
        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {formatTextWithBold(text.trim())}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    
    // Render für Screenshot-Format
    (sections, introText, links) => (
      <div className="space-y-2 w-full">
        {/* Nummerierte Abschnitte */}
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
              <div className="flex">
                <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium text-sm mr-2">
                  {section.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{section.title.endsWith(':') ? section.title.slice(0, -1) : section.title}</h3>
                  {section.content && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {formatTextWithBold(section.content.trim())}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Links */}
        {links.length > 0 && (
          <div className="mt-2">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    )
  );
}; 