import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  FileText,
  Package,
  LogOut,
  Icon,
} from 'lucide-react';

// --- Types and Interfaces ---

/**
 * Defines the structure for a single navigation item.
 * The `icon` is a Lucide React Icon component.
 */
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: Icon;
  children?: NavItem[];
}

/**
 * Props for the main Sidebar component.
 */
interface SidebarProps {
  /** The current active path/URL to highlight the active item. */
  activePath: string;
  /** Array of navigation items to display. */
  navigation: NavItem[];
  /** Optional callback for when a navigation item is clicked. */
  onNavigate?: (href: string) => void;
}

// --- Mock Data for Demonstration ---

// Using a placeholder for Sevensa's primary color (e.g., a deep blue/indigo)
const SEVENSA_PRIMARY = 'indigo-500';

const mockNavigation: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    id: 'users',
    label: 'Users & Access',
    href: '/users',
    icon: Users,
    children: [
      { id: 'all-users', label: 'All Users', href: '/users/all', icon: Users },
      { id: 'roles', label: 'Roles & Permissions', href: '/users/roles', icon: Settings },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    children: [
      { id: 'reports', label: 'Reports', href: '/analytics/reports', icon: FileText },
      { id: 'data', label: 'Raw Data', href: '/analytics/data', icon: Package },
    ],
  },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
];

// --- Sub-Components ---

/**
 * Renders a single navigation item, handling active state and nesting.
 */
const SidebarItem: React.FC<{
  item: NavItem;
  activePath: string;
  isCollapsed: boolean;
  level: number;
  onNavigate: (href: string) => void;
}> = ({ item, activePath, isCollapsed, level, onNavigate }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = activePath === item.href;
  const [isExpanded, setIsExpanded] = useState(isActive || false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Determine if any child is active to keep parent expanded
  const isChildActive = useMemo(() => {
    if (!item.children) return false;
    return item.children.some(child => activePath.startsWith(child.href));
  }, [item.children, activePath]);

  useEffect(() => {
    // Auto-expand if a child is active, but only for the first render or when activePath changes
    if (isChildActive && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isChildActive, isExpanded]);

  const toggleExpanded = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (hasChildren) {
      setIsExpanded(prev => !prev);
    } else {
      onNavigate(item.href);
    }
  }, [hasChildren, item.href, onNavigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      toggleExpanded(e);
    }
  }, [toggleExpanded]);

  // Tailwind classes for styling
  const baseClasses = `flex items-center w-full p-2 rounded-lg transition-all duration-200 ease-in-out group focus:outline-none focus:ring-2 focus:ring-${SEVENSA_PRIMARY} focus:ring-opacity-50`;
  const activeClasses = `bg-${SEVENSA_PRIMARY} text-white shadow-md`;
  const inactiveClasses = `text-gray-300 hover:bg-gray-700 hover:text-white`;
  const paddingLeft = level > 0 ? `pl-${4 + level * 2}` : 'pl-3';

  const linkClasses = `${baseClasses} ${paddingLeft} ${isActive ? activeClasses : inactiveClasses}`;

  // Collapsible content height for smooth transition
  const contentHeight = isExpanded && contentRef.current ? contentRef.current.scrollHeight : 0;

  return (
    <li role="none" className="my-1">
      <a
        href={item.href}
        onClick={toggleExpanded}
        onKeyDown={handleKeyDown}
        className={linkClasses}
        aria-current={isActive ? 'page' : undefined}
        aria-expanded={hasChildren ? isExpanded : undefined}
        role="menuitem"
        tabIndex={0} // Make it focusable
      >
        <item.icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} aria-hidden="true" />
        <span className={`flex-1 whitespace-nowrap overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
          {item.label}
        </span>
        {hasChildren && !isCollapsed && (
          <span className="ml-auto">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        )}
      </a>

      {/* Nested Menu (Recursive Call) */}
      {hasChildren && (
        <div
          ref={contentRef}
          style={{ maxHeight: isCollapsed ? '0' : `${contentHeight}px` }}
          className={`overflow-hidden transition-max-height duration-300 ease-in-out ${isCollapsed ? 'max-h-0' : ''}`}
          aria-hidden={isCollapsed || !isExpanded}
        >
          <ul role="menu" className="pt-1 border-l border-gray-700 ml-5">
            {item.children!.map(child => (
              <SidebarItem
                key={child.id}
                item={child}
                activePath={activePath}
                isCollapsed={isCollapsed}
                level={level + 1}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
};

// --- Main Component ---

/**
 * A production-ready, collapsible sidebar navigation component.
 * Features: TypeScript, Tailwind CSS, Nested Menus, Active States, Accessibility, and Keyboard Navigation.
 */
const Sidebar: React.FC<SidebarProps> = ({ activePath, navigation, onNavigate = () => {} }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  // Base classes for the sidebar container
  const baseSidebarClasses = `fixed top-0 left-0 h-full z-40 bg-gray-900 text-white transition-all duration-300 ease-in-out flex flex-col`;
  const collapsedWidth = 'w-20';
  const expandedWidth = 'w-64';

  // Desktop Sidebar Classes
  const desktopClasses = `hidden md:flex ${isCollapsed ? collapsedWidth : expandedWidth} ${baseSidebarClasses}`;

  // Mobile Overlay Classes
  const mobileOverlayClasses = `fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`;
  const mobileSidebarClasses = `fixed top-0 left-0 h-full z-40 bg-gray-900 text-white transition-transform duration-300 ease-in-out md:hidden ${expandedWidth} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <>
      {/* Mobile Menu Button (Top-Left) */}
      <button
        className={`fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 text-white md:hidden focus:outline-none focus:ring-2 focus:ring-${SEVENSA_PRIMARY}`}
        onClick={toggleMobileMenu}
        aria-label={isMobileOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      <div className={mobileOverlayClasses} onClick={toggleMobileMenu} aria-hidden={!isMobileOpen} />

      {/* Mobile Sidebar */}
      <aside className={mobileSidebarClasses} role="navigation" aria-label="Main navigation (Mobile)">
        <div className="p-4 flex items-center justify-between h-16 border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Sevensa</h1>
          <button
            className={`p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-${SEVENSA_PRIMARY}`}
            onClick={toggleMobileMenu}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3">
          <ul role="menu">
            {navigation.map(item => (
              <SidebarItem
                key={item.id}
                item={item}
                activePath={activePath}
                isCollapsed={false} // Mobile is always expanded
                level={0}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-gray-700">
          <a
            href="/logout"
            className={`flex items-center w-full p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-${SEVENSA_PRIMARY}`}
            role="menuitem"
          >
            <LogOut className="w-5 h-5 mr-3" aria-hidden="true" />
            <span className="whitespace-nowrap">Logout</span>
          </a>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className={desktopClasses} role="navigation" aria-label="Main navigation (Desktop)">
        {/* Header/Branding */}
        <div className="p-4 flex items-center justify-center h-16 border-b border-gray-700">
          <h1 className={`text-xl font-bold text-white overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
            Sevensa
          </h1>
          <div className={`text-xl font-bold text-white ${isCollapsed ? 'block' : 'hidden'}`}>S</div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-3">
          <ul role="menu">
            {navigation.map(item => (
              <SidebarItem
                key={item.id}
                item={item}
                activePath={activePath}
                isCollapsed={isCollapsed}
                level={0}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        </nav>

        {/* Footer/Collapse Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={toggleCollapse}
            className={`flex items-center w-full p-2 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-${SEVENSA_PRIMARY}`}
            aria-expanded={!isCollapsed}
            aria-controls="desktop-sidebar-nav"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <div className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`}>
              {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </div>
            <span className={`whitespace-nowrap overflow-hidden transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
              Collapse Menu
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

// Export the main component
export default Sidebar;

// --- Example Usage (Optional, for context) ---
/*
const App = () => {
  const [currentPath, setCurrentPath] = useState('/dashboard');
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        activePath={currentPath}
        navigation={mockNavigation}
        onNavigate={setCurrentPath}
      />
      <main className="flex-1 p-8 transition-all duration-300 ease-in-out md:ml-64">
        <h1 className="text-3xl font-bold">Content for: {currentPath}</h1>
        <p>This is the main content area.</p>
      </main>
    </div>
  );
};
*/