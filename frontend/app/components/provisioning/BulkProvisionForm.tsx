'use client';

import { useState } from 'react';
import { z } from '@/lib/zod';

type CustomerData = z.infer<typeof BulkProvisionSchema>;
const BulkProvisionSchema = z.array(z.object({
  name: z.string(),
  email: z.string(),
  partnerId: z.string(),
  metadata: z.record(z.string()).optional()
}));

export function BulkProvisionForm() {
  const [inputData, setInputData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ processedCount: number } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Parse CSV input (simplified example)
      const parsedData = inputData.split('\n').map(line => {
        const [name, email, partnerId] = line.split(',');
        return { name, email, partnerId };
      });

      // Validate client-side
      const validation = BulkProvisionSchema.safeParse(parsedData);
      if (!validation.success) {
        setError('Invalid input format');
        return;
      }

      // Call provisioning API
      const response = await fetch('/api/provisioning/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Provisioning failed');
      }

      const resultData = await response.json();
      setResult(resultData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Bulk Customer Provisioning</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Data (CSV format):
          </label>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            className="w-full h-48 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="name,email,partnerId\nJohn Doe,john@example.com,123e4567-e89b-12d3-a456-426614174000"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${loading ? 'bg-blue-400 hover:bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} focus:ring-blue-500`}
        >
          {loading ? 'Processing...' : 'Provision Customers'}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 rounded-md">
          Successfully provisioned {result.processedCount} customers
        </div>
      )}
    </div>
  );
}
