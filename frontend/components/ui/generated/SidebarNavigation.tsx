import React, { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  FileText,
  Package,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LogOut,
  UserCircle,
} from 'lucide-react';

// Define the navigation item structure
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  current: boolean;
  children?: NavItem[];
}

// Define the main navigation structure based on the design specs
const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard/psra-manager', icon: LayoutDashboard, current: true },
  {
    name: 'Certificates & Docs',
    href: '#',
    icon: FileText,
    current: false,
    children: [
      { name: 'Certificate List', href: '/certificates/list', icon: FileText, current: false },
      { name: 'Generate Certificate', href: '/certificates/generate', icon: FileText, current: false },
      { name: 'Document Library', href: '/documents/library', icon: FileText, current: false },
    ],
  },
  {
    name: 'Suppliers & Products',
    href: '#',
    icon: Package,
    current: false,
    children: [
      { name: 'Supplier List', href: '/suppliers/list', icon: Users, current: false },
      { name: 'Product List', href: '/products/list', icon: Package, current: false },
      { name: 'BOM Editor', href: '/products/bom', icon: Package, current: false },
    ],
  },
  { name: 'Analytics & Reports', href: '/analytics/overview', icon: TrendingUp, current: false },
  { name: 'Admin & Settings', href: '/admin/users', icon: Settings, current: false },
];

const SidebarNavigation: React.FC = () => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (name: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isCurrent = item.current; // In a real app, this would be based on router.pathname
    const isActive = isCurrent || openSections[item.name];
    const Icon = item.icon;

    return (
      <div>
        <Link
          href={item.href === '#' ? '#' : item.href}
          onClick={(e) => {
            if (item.children) {
              e.preventDefault();
              toggleSection(item.name);
            }
          }}
          className={`
            group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
            ${isCurrent
              ? 'bg-sevensa-teal text-white shadow-sevensa'
              : 'text-gray-300 hover:bg-sevensa-dark-light hover:text-white'
            }
          `}
        >
          <Icon
            className={`mr-3 h-5 w-5 flex-shrink-0 ${isCurrent ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
            aria-hidden="true"
          />
          {item.name}
          {item.children && (
            <span className="ml-auto">
              {isActive ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </span>
          )}
        </Link>
        {item.children && isActive && (
          <div className="ml-6 mt-1 space-y-1">
            {item.children.map((child) => (
              <Link
                key={child.name}
                href={child.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${child.current
                    ? 'bg-sevensa-teal/80 text-white'
                    : 'text-gray-400 hover:bg-sevensa-dark-light hover:text-white'
                  }
                `}
              >
                {child.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-64 bg-sevensa-dark text-white shadow-2xl">
      {/* Logo Section */}
      <div className="flex items-center justify-center h-16 flex-shrink-0 px-4 border-b border-sevensa-dark-light">
        <span className="text-xl font-bold text-sevensa-teal">SEVENSA</span>
        <span className="text-xs ml-1 text-gray-400">PSRA-LTSD</span>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <NavLink key={item.name} item={item} />
          ))}
        </nav>

        {/* Help & Support */}
        <div className="pt-4 border-t border-sevensa-dark-light">
          <NavLink item={{ name: 'Help & Support', href: '/help', icon: HelpCircle, current: false }} />
        </div>
      </div>

      {/* User Profile Section */}
      <div className="flex items-center justify-between p-4 border-t border-sevensa-dark-light">
        <div className="flex items-center">
          <UserCircle className="h-8 w-8 text-gray-400" />
          <div className="ml-3">
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-400">PSRA Manager</p>
          </div>
        </div>
        <button
          type="button"
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-sevensa-dark-light transition-colors"
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default SidebarNavigation;
