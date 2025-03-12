import React from 'react';

// Custom InfoComponent für die Anzeige von Info-Elementen
export const InfoComponent = ({ content }: { content: string }) => (
  <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-800 dark:text-blue-300">
    <strong>Info:</strong> {content}
  </div>
); 