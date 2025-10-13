'use client';

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-6 focus:py-3 focus:bg-sevensa-teal focus:text-white focus:font-bold focus:rounded-lg focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
