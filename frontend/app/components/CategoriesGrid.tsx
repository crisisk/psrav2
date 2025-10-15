'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function CategoriesGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Resource Categories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div
            key={category.id}
            className="border rounded-lg p-6 hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-xl font-semibold mb-2">{category.name}</h2>
            <p className="text-gray-600">{category.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}