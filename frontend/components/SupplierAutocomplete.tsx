'use client';

import { useEffect, useState } from 'react';

interface Supplier {
  id: string;
  name: string;
  location: string;
}

interface SupplierAutocompleteProps {
  onSelect: (supplier: Supplier | null) => void;
  initialValue?: string;
}

export function SupplierAutocomplete({
  onSelect,
  initialValue = '',
}: SupplierAutocompleteProps) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue.trim()) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/suppliers?query=${encodeURIComponent(inputValue)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch suppliers');
        }

        const { data } = await response.json();
        setSuggestions(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load suppliers. Please try again.');
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(debounceTimer);
  }, [inputValue]);

  const handleSelect = (supplier: Supplier) => {
    setInputValue(supplier.name);
    setSuggestions([]);
    onSelect(supplier);
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onSelect(null);
        }}
        placeholder="Search supplier..."
        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        aria-autocomplete="list"
        aria-expanded={suggestions.length > 0}
      />

      {(isLoading || error || suggestions.length > 0) && (
        <div className="absolute z-10 w-full mt-2 bg-white border rounded-lg shadow-lg">
          {isLoading && (
            <div className="p-4 text-gray-500">Loading suppliers...</div>
          )}

          {error && (
            <div className="p-4 text-red-500">{error}</div>
          )}

          {!isLoading && !error && suggestions.map((supplier) => (
            <button
              key={supplier.id}
              onClick={() => handleSelect(supplier)}
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 outline-none transition-colors"
              type="button"
            >
              <div className="font-medium">{supplier.name}</div>
              <div className="text-sm text-gray-500">{supplier.location}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
