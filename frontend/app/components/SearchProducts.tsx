'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';

export default function SearchProducts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const { data } = await response.json();
        setResults(data);
      } catch (err) {
        console.error('Search failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to perform search');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search products..."
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Product search input"
        />

        {(isLoading || error || results.length > 0) && (
          <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg">
            {isLoading && (
              <div className="p-4 text-gray-500">Searching...</div>
            )}

            {error && (
              <div className="p-4 text-red-500">{error}</div>
            )}

            {!isLoading && !error && results.length > 0 && (
              <ul className="divide-y">
                {results.map((product) => (
                  <li
                    key={product.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <h3 className="font-semibold">{product.name}</h3>
                    {product.description && (
                      <p className="text-gray-600 mt-1">{product.description}</p>
                    )}
                    <div className="mt-2 text-sm text-blue-600">
                      Status: {product.certification_status}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!isLoading && !error && results.length === 0 && searchTerm.length >= 2 && (
              <div className="p-4 text-gray-500">No results found</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
