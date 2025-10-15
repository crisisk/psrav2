'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import clsx from 'clsx';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors duration-150',
        'bg-transparent hover:bg-[rgba(37,99,235,0.08)] dark:hover:bg-[rgba(96,165,250,0.12)]',
        'border-[rgba(148,163,184,0.4)] text-muted',
        className
      )}
      aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
    >
      {isDark ? (
        <>
          <Moon className="h-4 w-4" aria-hidden="true" />
          Donker
        </>
      ) : (
        <>
          <Sun className="h-4 w-4" aria-hidden="true" />
          Licht
        </>
      )}
    </button>
  );
}

