import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Breadcrumb-Komponente für die Navigation
 * 
 * @param items Array von Breadcrumb-Items (label, href, isCurrent)
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        {items.map((item, index) => (
          <li key={item.href} className="inline-flex items-center">
            {index === 0 ? (
              // Erstes Element mit Home-Icon
              <Link 
                href={item.href}
                className={`inline-flex items-center text-sm font-medium ${
                  item.isCurrent 
                    ? 'text-gray-500 dark:text-gray-400 cursor-default' 
                    : 'text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white'
                }`}
                aria-current={item.isCurrent ? 'page' : undefined}
                onClick={e => item.isCurrent && e.preventDefault()}
              >
                <Home className="w-4 h-4 mr-2" />
                {item.label}
              </Link>
            ) : (
              // Nachfolgende Elemente mit Trennzeichen
              <>
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                <Link
                  href={item.href}
                  className={`ml-1 text-sm font-medium ${
                    item.isCurrent 
                      ? 'text-gray-500 dark:text-gray-400 cursor-default' 
                      : 'text-gray-700 hover:text-primary dark:text-gray-300 dark:hover:text-white'
                  }`}
                  aria-current={item.isCurrent ? 'page' : undefined}
                  onClick={e => item.isCurrent && e.preventDefault()}
                >
                  {item.label}
                </Link>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
} 