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
      <div className="space-y-4">
        {/* Zeige Einführungstext, falls vorhanden */}
        {introText && introText.trim().length > 0 && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
            {formatTextWithBold(introText)}
          </div>
        )}
        
        {/* Container für die nummerierten Abschnitte */}
        <div className="space-y-3 rounded-xl overflow-hidden">
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
          <div className="mt-4">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    // Render bulleted list
    (sections, introText, links) => (
      <div className="space-y-4">
        {/* Zeige Inhalte, die vor den strukturierten Daten stehen könnten */}
        {introText && introText.trim().length > 0 && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
            {formatTextWithBold(introText)}
          </div>
        )}
        
        {/* Zeige strukturierte Abschnitte */}
        <div className="space-y-3">
          {sections.map((section, index) => (
            <StructuredContent 
              key={index} 
              title={section.title} 
              items={section.items} 
            />
          ))}
        </div>
        
        {/* Link-Cards am Ende anzeigen */}
        {links.length > 0 && (
          <div className="mt-4">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    // Render simple text
    (text, links) => (
      <div className="space-y-4">
        <div className="text-sm space-y-3 leading-relaxed">
          {text.split(/\n\s*\n/).map((section, sectionIndex) => 
            section.trim().length > 0 ? (
              <p key={sectionIndex} className="whitespace-pre-wrap">
                {formatTextWithBold(section)}
              </p>
            ) : null
          )}
        </div>
        
        {/* Link-Cards am Ende anzeigen */}
        {links.length > 0 && (
          <div className="mt-4">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    ),
    // Render screenshot format
    (sections, introText, links) => (
      <div className="space-y-4">
        {/* Zeige Einführungstext, falls vorhanden */}
        {introText && introText.trim().length > 0 && (
          <div className="text-sm leading-relaxed whitespace-pre-wrap mb-2">
            {formatTextWithBold(introText)}
          </div>
        )}
        
        {/* Container für die nummerierten Cards */}
        <div className="space-y-3">
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
          <div className="mt-4">
            <LinkCardSlider links={links} />
          </div>
        )}
      </div>
    )
  );
}; 