'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SkipLink } from '@/shared/ui/common/SkipLink';
import { SearchBar } from '@/shared/ui/common/SearchBar';
import NotificationsCenter from '@/shared/ui/common/NotificationsCenter';
import KeyboardShortcutsModal from '@/shared/ui/common/KeyboardShortcuts';
import { SupportModal } from '@/shared/ui/common/SupportModal';
import { Menu, X } from 'lucide-react';

const queryClient = new QueryClient();

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/cfo', label: 'CFO' },
    { href: '/supplier', label: 'Supplier' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <QueryClientProvider client={queryClient}>
      <SkipLink />
      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-dark-bg-surface border-b border-border dark:border-dark-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center space-x-3">
              <Image
                src="/sevensa_final_logo.png"
                alt="Sevensa"
                width={120}
                height={32}
                className="h-8 w-auto"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-sevensa-teal dark:text-sevensa-teal-400'
                      : 'text-text-primary dark:text-dark-text-primary hover:text-sevensa-teal dark:hover:text-sevensa-teal-400'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <SearchBar />
              <NotificationsCenter />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg-base transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-text-primary dark:text-dark-text-primary" />
              ) : (
                <Menu className="h-6 w-6 text-text-primary dark:text-dark-text-primary" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-border dark:border-dark-border">
              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive(link.href)
                        ? 'bg-sevensa-teal/10 text-sevensa-teal dark:text-sevensa-teal-400'
                        : 'text-text-primary dark:text-dark-text-primary hover:bg-gray-100 dark:hover:bg-dark-bg-base'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-border dark:border-dark-border">
                  <SearchBar />
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-dark-bg-surface border-t border-border dark:border-dark-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image
                src="/sevensa_final_logo.png"
                alt="Sevensa"
                width={100}
                height={28}
                className="h-7 w-auto"
              />
              <span className="text-xs text-text-muted dark:text-dark-text-muted">
                © 2025 Sevensa. AI-powered solutions for businesses.
              </span>
            </div>
            <div className="flex space-x-6 text-sm text-text-muted dark:text-dark-text-muted">
              <Link href="/" className="hover:text-sevensa-teal transition-colors">
                Home
              </Link>
              <button
                onClick={() => setSupportModalOpen(true)}
                className="hover:text-sevensa-teal transition-colors"
              >
                Support
              </button>
              <Link href="/privacy" className="hover:text-sevensa-teal transition-colors">
                Privacy
              </Link>
              <Link href="/api-docs" className="hover:text-sevensa-teal transition-colors">
                API Docs
              </Link>
              <Link href="/help" className="hover:text-sevensa-teal transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SupportModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </QueryClientProvider>
  );
}
