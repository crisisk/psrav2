'use client';

import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export function CustomerViewAll() {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleViewAll = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCustomers(data.data);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('Failed to load customers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <button
        onClick={handleViewAll}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Spinner className="h-4 w-4" />
            Loading...
          </span>
        ) : (
          'View All Customers'
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {customers.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-4 text-sm text-gray-900">{customer.id}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{customer.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">{customer.email}</td>
                  <td className="px-4 py-4 text-sm text-gray-900">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
