import React from 'react';

interface SectionHeadingProps {
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
}

/**
 * Eine wiederverwendbare Überschriften-Komponente für Abschnitte
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  description,
  rightElement
}) => {
  return (
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {rightElement && (
        <div className="ml-auto">
          {rightElement}
        </div>
      )}
    </div>
  );
};

/**
 * Eine Hilfstextkomponente für erklärende Texte unter Eingabefeldern
 */
export const HelpText: React.FC<{children: React.ReactNode}> = ({children}) => {
  return <p className="text-sm text-muted-foreground mt-1 mb-3">{children}</p>;
}; 