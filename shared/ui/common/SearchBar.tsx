'use client';

import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { trackEvent } from '@/shared/lib/telemetry';
import Link from 'next/link';

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        trackEvent('search_opened', { method: 'keyboard' });
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      fetch(`/api/assessments?q=${query}`)
        .then(res => res.json())
        .then(data => setResults(data.slice(0, 5)))
        .catch(console.error);
    } else {
      setResults([]);
    }
  }, [query]);

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          trackEvent('search_opened', { method: 'button' });
        }}
        className="flex items-center space-x-2 px-4 py-2 bg-bg-muted hover:bg-bg-hover rounded-lg transition-colors"
      >
        <Search className="w-4 h-4 text-text-muted" />
        <span className="text-sm text-text-muted">Search</span>
        <kbd className="hidden md:inline-block px-2 py-1 text-xs bg-white border border-border rounded">⌘K</kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20">
      <div className="bg-white dark:bg-dark-bg-surface rounded-xl w-full max-w-2xl shadow-2xl">
        <div className="flex items-center border-b border-border p-4">
          <Search className="w-5 h-5 text-text-muted mr-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assessments, products, HS codes..."
            className="flex-1 bg-transparent outline-none text-base"
            autoFocus
          />
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-bg-muted rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="p-2 max-h-96 overflow-y-auto">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/assessment/${result.id}`}
                onClick={() => {
                  setIsOpen(false);
                  trackEvent('search_result_clicked', { assessmentId: result.id });
                }}
                className="block p-4 hover:bg-bg-surface rounded-lg transition-colors"
              >
                <div className="font-semibold text-sevensa-dark dark:text-dark-text-primary">
                  {result.productName}
                </div>
                <div className="text-sm text-text-muted">
                  {result.hsCode} • {result.verdict}
                </div>
              </Link>
            ))}
          </div>
        )}

        {query.length > 2 && results.length === 0 && (
          <div className="p-8 text-center text-text-muted">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
