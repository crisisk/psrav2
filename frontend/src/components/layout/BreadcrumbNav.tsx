import React from 'react';
import { ChevronRight } from 'lucide-react';

// Define the type for breadcrumb items
interface BreadcrumbItem {
  label: string;
  url: string;
}

// Define the props for the BreadcrumbNav component
interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={item.url}>
          {index > 0 && <ChevronRight className="h-4 w-4 text-gray-500" />}
          {index === items.length - 1 ? (
            <span className="font-bold text-gray-900">{item.label}</span>
          ) : (
            <a
              href={item.url}
              className="text-gray-500 hover:text-gray-700 hover:underline"
            >
              {item.label}
            </a>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default BreadcrumbNav;