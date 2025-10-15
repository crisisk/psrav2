'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import type { ReactNode } from 'react';
import clsx from 'clsx';

import { ThemeToggle } from '@/components/ui/theme-toggle';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppShellProps {
  children: ReactNode;
  variant?: 'default' | 'narrow';
  contentClassName?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const NAV_ITEMS: Array<{ label: string; href: string }> = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Onboarding', href: '/onboarding/import' },
  { label: 'Signup', href: '/signup' }
];

export function AppShell({
  children,
  variant = 'default',
  contentClassName,
  breadcrumbs
}: AppShellProps) {
  const pathname = usePathname();
  const activeHref = useMemo(() => {
    if (!pathname) {
      return undefined;
    }

    if (pathname === '/') {
      return '/dashboard';
    }

    const match = NAV_ITEMS.find(item => pathname.startsWith(item.href));
    return match?.href;
  }, [pathname]);

  const mainClassName = clsx(
    'relative mx-auto flex w-full flex-1 flex-col space-y-10 px-4 py-10 lg:space-y-12 lg:py-12',
    variant === 'narrow' ? 'max-w-4xl' : 'max-w-7xl',
    contentClassName
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-bg)]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.18)_0%,_transparent_70%)] blur-3xl" />
        <div className="absolute right-[-12%] top-1/3 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(45,212,191,0.18)_0%,_transparent_75%)] blur-3xl" />
      </div>
      <div className="relative flex min-h-screen flex-col">
        <header className="sticky top-0 z-20 border-b border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-full border border-[rgba(148,163,184,0.3)] bg-[var(--color-surface-muted)]/60 px-4 py-2 text-sm font-semibold text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-accent)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-bold text-white shadow-md">
                  PS
                </span>
                <span>PSRA-LTSD Enterprise</span>
              </Link>
              <nav aria-label="Hoofd navigatie" className="hidden items-center gap-5 md:flex">
                {NAV_ITEMS.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={clsx(
                      'text-sm font-semibold transition-colors',
                      activeHref === item.href
                        ? 'text-[var(--color-text)]'
                        : 'text-subtle hover:text-[var(--color-text)]'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center justify-between gap-3 md:justify-end">
              <span className="badge badge-neutral hidden sm:inline-flex bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                Enterprise preview
              </span>
              <ThemeToggle />
            </div>
          </div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="border-t border-[rgba(148,163,184,0.2)] bg-[var(--color-surface)]/80">
              <nav aria-label="Kruimelpad" className="mx-auto max-w-7xl px-4 py-3">
                <ol className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1;
                    return (
                      <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                        {item.href && !isLast ? (
                          <Link href={item.href} className="transition-colors hover:text-[var(--color-text)]">
                            {item.label}
                          </Link>
                        ) : (
                          <span className={clsx(isLast ? 'font-semibold text-[var(--color-text)]' : undefined)}>
                            {item.label}
                          </span>
                        )}
                        {!isLast && <span aria-hidden="true" className="text-[rgba(148,163,184,0.8)]">/</span>}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            </div>
          )}
        </header>

        <main id="main-content" className={mainClassName}>
          {children}
        </main>

        <footer className="mt-auto border-t border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-subtle md:flex-row md:items-center md:justify-between">
            <p className="font-semibold text-[var(--color-text)]">© {new Date().getFullYear()} Sevensa Compliance Systems</p>
            <div className="flex flex-wrap items-center gap-4">
              <span>EU AI Act-ready</span>
              <span>ISO 27001 / 27701 in voorbereiding</span>
              <span>SLO p95 &lt; 1s monitor</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
