'use client';

import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface Product {
  id: string;
  name: string;
}

export default function ProductsAutocomplete() {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/products?q=${encodeURIComponent(debouncedQuery)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const { data } = await response.json();
        setResults(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load products. Please try again.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [debouncedQuery]);

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a product..."
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
      />

      {(loading || error || results.length > 0) && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
          {loading && (
            <div className="p-2 text-gray-500">Searching products...</div>
          )}

          {error && (
            <div className="p-2 text-red-500">{error}</div>
          )}

          {!loading && !error && results.map((product) => (
            <button
              key={product.id}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 outline-none transition-colors"
              onClick={() => setQuery(product.name)}
            >
              {product.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
