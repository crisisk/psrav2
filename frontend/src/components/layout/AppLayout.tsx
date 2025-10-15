import React, { useState } from 'react';
import { LayoutDashboard, Settings, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { theme, setTheme } = useTheme();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigationItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Users, label: 'Users' },
    { icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-muted/40 transition-all duration-300 ease-in-out',
          isSidebarOpen ? 'w-64' : 'w-20'
        )}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div>
            <div className="flex items-center justify-between">
              <h1 className={cn('text-lg font-semibold', !isSidebarOpen && 'hidden')}>
                MyApp
              </h1>
              <Button variant="ghost" size="sm" onClick={toggleSidebar}>
                {isSidebarOpen ? '«' : '»'}
              </Button>
            </div>
            <Separator className="my-4" />
            <nav>
              <ul className="space-y-2">
                {navigationItems.map((item, index) => (
                  <li key={index}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start',
                        !isSidebarOpen && 'justify-center'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {isSidebarOpen && <span className="ml-2">{item.label}</span>}
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <Button variant="ghost" className="w-full justify-start">
            <LogOut className="h-4 w-4" />
            {isSidebarOpen && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between bg-background p-4 shadow-sm">
          <h1 className="text-xl font-bold">Welcome Back</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>

        {/* Footer */}
        <footer className="bg-background p-4 text-center text-sm text-muted-foreground">
          &copy; 2023 MyApp. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;