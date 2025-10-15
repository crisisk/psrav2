'use client';

import { useState, useEffect } from 'react';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setResults(data.results);
      } catch (err) {
        console.error('Search failed:', err);
        setError('Failed to fetch results. Please try again.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search requests
    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <input
          type="text"
          placeholder="Search assessments..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-blue-500
            transition-all duration-200"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search conformity assessments"
        />

        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-6 w-6
              border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Results container */}
      {error && (
        <div className="mt-2 p-3 text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-2 bg-white border border-gray-200
          rounded-lg shadow-lg overflow-hidden">
          {results.map((result) => (
            <div
              key={result.id}
              className="p-4 hover:bg-gray-50 transition-colors
                border-b border-gray-100 last:border-b-0"
            >
              <h3 className="font-semibold text-gray-800">{result.title}</h3>
              <p className="text-gray-600 mt-1 text-sm">
                {result.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
