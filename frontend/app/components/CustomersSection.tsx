'use client';

import { useState, useEffect } from 'react';

type Customer = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
};

export default function CustomersSection() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customers');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { success, data, error } = await response.json();

      if (!success) {
        throw new Error(error || 'Failed to load customers');
      }

      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Customers</h2>
        <button
          onClick={fetchAllCustomers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700
            disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Loading...' : 'View All'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {customers.map((customer) => (
          <div
            key={customer.id}
            className="p-4 border rounded-md hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">{customer.name}</h3>
            <p className="text-gray-600">{customer.email}</p>
            <span className={`inline-block mt-2 px-2 py-1 text-sm rounded-full
              ${customer.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'}`}>
              {customer.status}
            </span>
          </div>
        ))}
      </div>

      {customers.length === 0 && !loading && !error && (
        <p className="text-gray-500 text-center py-4">
          No customers to display
        </p>
      )}
    </div>
  );
}