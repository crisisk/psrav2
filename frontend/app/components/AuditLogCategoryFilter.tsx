'use client';

import { useEffect, useState, useCallback } from 'react';

type AuditLogCategory = {
  id: string;
  name: string;
};

type ApiResponse = {
  success: boolean;
  data?: AuditLogCategory[];
  error?: string;
};

export default function AuditLogCategoryFilter() {
  const [categories, setCategories] = useState<AuditLogCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/audit-log-categories');
      const data: ApiResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || 'Failed to load categories');
      }

      setCategories(data.data);
      setError(null);
    } catch (err) {
      console.error('Category fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCheckboxChange = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  if (loading) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Loading categories...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-sm">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="w-64 border-r border-gray-200 p-4">
      <h3 className="font-semibold mb-4 text-gray-700">Filter by Category</h3>
      <div className="space-y-2">
        {categories.map(category => (
          <label
            key={category.id}
            className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.id)}
              onChange={() => handleCheckboxChange(category.id)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{category.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
