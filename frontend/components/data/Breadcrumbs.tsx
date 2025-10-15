import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDownIcon, HomeIcon } from '@heroicons/react/20/solid';

// --- Types ---

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

interface BreadcrumbsProps {
  /** The array of breadcrumb items. */
  items: BreadcrumbItem[];
  /** The maximum number of visible items before collapsing into a dropdown. Defaults to 4. */
  maxItems?: number;
}

// --- Constants & Styling ---

const SEVENSA_BRANDING = {
  primary: 'text-indigo-600 hover:text-indigo-800',
  separator: 'text-gray-400',
  text: 'text-gray-600 hover:text-indigo-600',
  current: 'text-gray-900 font-medium',
  dropdownBg: 'bg-white',
  dropdownBorder: 'border border-gray-200',
  dropdownShadow: 'shadow-lg',
};

const Separator = () => (
  <svg
    className={`flex-shrink-0 h-5 w-5 ${SEVENSA_BRANDING.separator}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M5.555 17.776l8-16 .894.448-8 16-.894-.448z" />
  </svg>
);

// --- Component ---

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, maxItems = 4 }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isCollapsed = items.length > maxItems;

  const visibleItems = useMemo(() => {
    if (!isCollapsed) {
      return items;
    }

    // Keep the first item (Home) and the last two items visible
    // The collapsed section will be between the first and the second-to-last item.
    const firstItem = items[0];
    const lastTwoItems = items.slice(-2);

    return [firstItem, ...lastTwoItems];
  }, [items, isCollapsed]);

  const collapsedItems = useMemo(() => {
    if (!isCollapsed) {
      return [];
    }
    // Items to go into the dropdown: everything between the first and the second-to-last
    return items.slice(1, items.length - 2);
  }, [items, isCollapsed]);

  const renderItem = (item: BreadcrumbItem, index: number) => {
    const isFirst = index === 0;
    const isLast = index === visibleItems.length - 1;
    const isCurrent = item.isCurrent || isLast;

    const linkClasses = isCurrent
      ? SEVENSA_BRANDING.current
      : SEVENSA_BRANDING.text;

    return (
      <li key={item.href} className="flex items-center">
        {index > 0 && <Separator />}
        <div className="ml-4">
          <a
            href={item.href}
            className={`text-sm ${linkClasses} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded`}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {isFirst ? (
              <HomeIcon className={`h-5 w-5 flex-shrink-0 ${SEVENSA_BRANDING.text}`} aria-hidden="true" />
            ) : (
              item.label
            )}
          </a>
        </div>
      </li>
    );
  };

  const renderCollapsedDropdown = () => {
    if (!isCollapsed) return null;

    return (
      <li className="flex items-center">
        <Separator />
        <div className="ml-4 relative">
          <button
            ref={buttonRef}
            type="button"
            className={`flex items-center text-sm ${SEVENSA_BRANDING.text} focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded`}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-controls="breadcrumbs-dropdown-menu"
          >
            ...
            <ChevronDownIcon className="ml-1 h-5 w-5" aria-hidden="true" />
          </button>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              id="breadcrumbs-dropdown-menu"
              className={`absolute z-10 mt-2 w-48 origin-top-left rounded-md ${SEVENSA_BRANDING.dropdownBg} ${SEVENSA_BRANDING.dropdownBorder} ${SEVENSA_BRANDING.dropdownShadow}`}
              role="menu"
              aria-orientation="vertical"
              tabIndex={-1}
            >
              <div className="py-1" role="none">
                {collapsedItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 text-sm ${SEVENSA_BRANDING.text} hover:bg-gray-100`}
                    role="menuitem"
                    tabIndex={-1}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </li>
    );
  };

  const finalItems = useMemo(() => {
    if (!isCollapsed) {
      return items.map(renderItem);
    }

    const [first, ...rest] = visibleItems;
    const lastTwo = rest;

    return [
      renderItem(first, 0),
      renderCollapsedDropdown(),
      ...lastTwo.map((item, index) => renderItem(item, index + 2)), // index + 2 to account for the first item and the dropdown
    ].filter(Boolean);
  }, [isCollapsed, visibleItems, items]);

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-4">
        {finalItems}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;