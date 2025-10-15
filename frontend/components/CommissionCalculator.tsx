'use client';

import { useState } from 'react';

type CommissionResult = {
  salesAmount: number;
  commissionRate: number;
  commissionAmount: number;
  tierRange: string;
};

export default function CommissionCalculator() {
  const [amount, setAmount] = useState<string>('');
  const [result, setResult] = useState<CommissionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount)) {
        throw new Error('Please enter a valid number');
      }

      const response = await fetch('/api/commissions/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ salesAmount: numericAmount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate commission');
      }

      const data: CommissionResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Sales Amount (€)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            step="0.01"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate Commission'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Commission Details</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Sales Amount:</dt>
              <dd className="font-medium">€{result.salesAmount.toFixed(2)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Commission Rate:</dt>
              <dd className="font-medium">{result.commissionRate * 100}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Tier Range:</dt>
              <dd className="font-medium">{result.tierRange}</dd>
            </div>
            <div className="flex justify-between border-t pt-2">
              <dt className="text-gray-600 font-semibold">Total Commission:</dt>
              <dd className="font-semibold text-blue-600">€{result.commissionAmount.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
