import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToastProvider } from '@/shared/ui/common/Toast';
import { ErrorBoundary } from '@/shared/ui/common/ErrorBoundary';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sevensa PSRA-LTSD | AI-powered solutions for businesses',
  description: 'Preferential Rules of Origin Analysis met AI. Ethische, op maat gemaakte AI-oplossingen die meetbare bedrijfswaarde leveren.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={montserrat.variable}>
      <head>
        <link rel="icon" href="/sevensa_favicon.png" />
      </head>
      <body className="min-h-screen bg-white dark:bg-dark-bg-base text-sevensa-dark dark:text-dark-text-primary antialiased font-sans transition-colors duration-300">
        <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-sevensa-teal focus:text-white focus:rounded-lg">
          Ga direct naar de hoofdinhoud
        </a>
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
