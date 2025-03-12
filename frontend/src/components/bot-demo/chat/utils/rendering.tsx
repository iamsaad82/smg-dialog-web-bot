import React from 'react';
import { formatTextWithBoldTitle } from './formatting';
import { formatTextWithBoldReact as formatTextWithBold } from './formatters';
import { NumberedStructuredContent } from '../components/NumberedStructuredContent';
import { StructuredContent } from '../components/StructuredContent';
import { LinkCardSlider } from '../components/LinkCardSlider';
import { NumberedCardContent } from '../components/NumberedCardContent';
import { LinkItem } from './types';

/**
 * Rendert strukturierten oder einfachen Text mit entsprechender Formatierung
 */
export const renderFormattedContent = (content: string) => {
  return formatTextWithBoldTitle(
    content,
    // Render numbered list
    (sections, introText, links) => (
      <div className="space-y-3">
        {/* Zeige Einführungstext, falls vorhanden */}
        {introText && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-1">
            {formatTextWithBold(introText)}
          </p>
        )}
        
        {/* Container für die nummerierten Abschnitte */}
        <div className="space-y-2 rounded-xl overflow-hidden">
          {/* Zeige nummerierte Abschnitte */}
          {sections.map((section, index) => (
            <NumberedStructuredContent
              key={index}
              number={section.number}
              title={section.title}
              content={section.content}
            />
          ))}
        </div>
        
        {/* Link-Cards am Ende anzeigen */}
        {links.length > 0 && (
          <LinkCardSlider links={links} />
        )}
      </div>
    ),
    // Render bulleted list
    (sections, introText, links) => (
      <div className="space-y-3">
        {/* Zeige Inhalte, die vor den strukturierten Daten stehen könnten */}
        {introText && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {formatTextWithBold(introText)}
          </p>
        )}
        
        {/* Zeige strukturierte Abschnitte */}
        {sections.map((section, index) => (
          <StructuredContent 
            key={index} 
            title={section.title} 
            items={section.items} 
          />
        ))}
        
        {/* Link-Cards am Ende anzeigen */}
        {links.length > 0 && (
          <LinkCardSlider links={links} />
        )}
      </div>
    ),
    // Render simple text
    (text, links) => (
      <div className="space-y-3">
        <div className="text-sm space-y-3 leading-relaxed">
          {text.split(/\n\s*\n/).map((section, sectionIndex) => {
            return (
              <p key={sectionIndex} className="whitespace-pre-wrap">
                {formatTextWithBold(section)}
              </p>
            );
          })}
        </div>
        
        {/* Link-Cards am Ende anzeigen */}
        {links.length > 0 && (
          <LinkCardSlider links={links} />
        )}
      </div>
    ),
    // Render screenshot format
    (sections, introText, links) => (
      <div className="space-y-3">
        {/* Zeige Einführungstext, falls vorhanden */}
        {introText && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-1">
            {formatTextWithBold(introText)}
          </p>
        )}
        
        {/* Container für die nummerierten Cards */}
        <div>
          {/* Zeige nummerierte Cards */}
          {sections.map((section, index) => (
            <NumberedCardContent
              key={index}
              number={section.number}
              title={section.title}
              content={section.content}
            />
          ))}
        </div>
        
        {/* Link-Cards am Ende anzeigen */}
        {links.length > 0 && (
          <LinkCardSlider links={links} />
        )}
      </div>
    )
  );
}; 