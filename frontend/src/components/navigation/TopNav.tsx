import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Bell, ChevronDown } from 'lucide-react';

// --- Types and Interfaces ---

interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

interface TopNavProps {
  user: User;
  onSearch: (query: string) => void;
  onNotificationClick: () => void;
  onUserMenuItemClick: (item: 'profile' | 'settings' | 'logout') => void;
}

// --- Utility Components ---

const SevensaLogo: React.FC = () => (
  <div className="flex items-center space-x-2">
    {/* Placeholder for Sevensa Logo/Icon - Using a simple SVG for branding */}
    <svg
      className="h-8 w-8 text-indigo-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
    <span className="text-xl font-bold text-gray-900 tracking-tight">Sevensa</span>
  </div>
);

interface UserMenuProps {
  user: User;
  onUserMenuItemClick: (item: 'profile' | 'settings' | 'logout') => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onUserMenuItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

  const handleItemClick = (item: 'profile' | 'settings' | 'logout') => {
    onUserMenuItemClick(item);
    setIsOpen(false);
    // Focus the button after closing the menu
    buttonRef.current?.focus();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for menu (Escape to close, Arrow keys to navigate)
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const items = menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]');
      if (items && items.length > 0) {
        const focusableItems = Array.from(items).filter(item => !item.disabled);
        if (focusableItems.length === 0) return;

        const currentIndex = focusableItems.findIndex(item => item === document.activeElement);
        let nextIndex = currentIndex;

        if (event.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % focusableItems.length;
        } else if (event.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + focusableItems.length) % focusableItems.length;
        }

        // If no item is currently focused, focus the first one on ArrowDown
        if (currentIndex === -1 && event.key === 'ArrowDown') {
            nextIndex = 0;
        }
        
        focusableItems[nextIndex].focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // When menu opens, focus the first item for immediate keyboard navigation
      const firstItem = menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]');
      if (firstItem) {
        // Use a timeout to ensure the menu is fully rendered before focusing
        setTimeout(() => firstItem.focus(), 0);
      }
    } else {
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);


  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        className="flex items-center rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        id="user-menu-button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={toggleMenu}
      >
        <span className="sr-only">Open user menu</span>
        <img
          className="h-8 w-8 rounded-full"
          src={user.avatarUrl}
          alt={`Avatar of ${user.name}`}
        />
        <ChevronDown className={`ml-1 h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
          // tabIndex={-1} is removed as we manage focus manually
        >
          <div className="px-4 py-2 text-sm text-gray-700 truncate border-b" role="none">
            <p className="font-medium">{user.name}</p>
            <p className="text-gray-500">{user.email}</p>
          </div>
          <button
            onClick={() => handleItemClick('profile')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            tabIndex={-1} // Managed by JS, not in natural tab order
          >
            Your Profile
          </button>
          <button
            onClick={() => handleItemClick('settings')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            tabIndex={-1} // Managed by JS, not in natural tab order
          >
            Settings
          </button>
          <button
            onClick={() => handleItemClick('logout')}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t mt-1 pt-1 text-red-600 hover:text-red-700 focus:outline-none focus:bg-gray-100"
            role="menuitem"
            tabIndex={-1} // Managed by JS, not in natural tab order
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

const TopNav: React.FC<TopNavProps> = ({ user, onSearch, onNotificationClick, onUserMenuItemClick }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50" aria-label="Main Navigation">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center">
            <SevensaLogo />
          </div>

          {/* Search Bar (Center) */}
          <div className="flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center" role="search">
              <label htmlFor="search-input" className="sr-only">Search Sevensa</label>
              <div className="relative w-full">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search-input"
                  type="search"
                  name="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-md border-0 bg-gray-100 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 transition duration-150 ease-in-out"
                  placeholder="Search..."
                  aria-label="Search"
                />
              </div>
            </form>
          </div>

          {/* Right Side Icons (Notifications and User Menu) */}
          <div className="ml-4 flex items-center md:ml-6">
            {/* Notifications Button */}
            <button
              type="button"
              className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
              aria-label="View notifications"
              onClick={onNotificationClick}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
            </button>

            {/* User Menu */}
            <div className="ml-3">
              <UserMenu user={user} onUserMenuItemClick={onUserMenuItemClick} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;