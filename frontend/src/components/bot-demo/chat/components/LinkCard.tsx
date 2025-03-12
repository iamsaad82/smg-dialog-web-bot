import React from 'react';
import { ExternalLink } from 'lucide-react';
import { LinkItem } from '../utils/types';

// Card-Komponente für Links
export const LinkCard = ({ url, title }: LinkItem) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="block w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700"
  >
    <div className="p-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-blue-600 dark:text-blue-400 truncate">{title}</h4>
        <ExternalLink className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 ml-2" />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{url}</p>
    </div>
  </a>
); 