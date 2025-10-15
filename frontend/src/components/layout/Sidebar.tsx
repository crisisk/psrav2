import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  ListChecks,
  Barcode,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Define menu items
  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/dashboard',
    },
    {
      name: 'Certificates',
      icon: <FileText className="h-5 w-5" />,
      path: '/certificates',
    },
    {
      name: 'Check Compliance',
      icon: <ShieldCheck className="h-5 w-5" />,
      path: '/compliance',
    },
    {
      name: 'Rules',
      icon: <ListChecks className="h-5 w-5" />,
      path: '/rules',
    },
    {
      name: 'HS Codes',
      icon: <Barcode className="h-5 w-5" />,
      path: '/hs-codes',
    },
    {
      name: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      path: '/settings',
    },
  ];

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-collapse on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div
      className={cn(
        'relative h-screen border-r bg-background transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-[70px]' : 'w-[220px]'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Collapse button */}
        <div className="flex items-center justify-between p-4">
          {!isCollapsed && (
            <h1 className="text-lg font-semibold">Trade Compliance</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="rounded-full"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation items */}
        <nav className="mt-6 flex-1 space-y-1 px-2">
          {menuItems.map((item) => (
            <Tooltip key={item.path} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  variant={location.pathname.startsWith(item.path) ? 'secondary' : 'ghost'}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'w-full justify-start',
                    isCollapsed ? 'justify-center px-0' : 'px-4'
                  )}
                >
                  <span className="mr-2">{item.icon}</span>
                  {!isCollapsed && <span>{item.name}</span>}
                </Button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right" className="ml-2">
                  {item.name}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>
      </div>
    </div>
  );
};