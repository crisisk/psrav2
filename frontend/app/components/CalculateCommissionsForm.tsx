'use client';

import { useState } from 'react';

type Transaction = {
  amount: string;
  date: string;
};

type CommissionResult = {
  totalCommission: number;
  breakdown: Array<{
    amount: number;
    commission: number;
    date: string;
  }>;
};

export default function CalculateCommissionsForm() {
  const [transactions, setTransactions] = useState<Transaction[]>([{ amount: '', date: '' }]);
  const [results, setResults] = useState<CommissionResult | null>(null);
  const [error, setError] = useState<string>('');

  const addTransaction = () => {
    setTransactions([...transactions, { amount: '', date: '' }]);
  };

  const removeTransaction = (index: number) => {
    const updated = transactions.filter((_, i) => i !== index);
    setTransactions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults(null);

    const formData = new FormData(e.currentTarget as HTMLFormElement);
    
    const transactionsData = transactions.map((_, index) => ({
      amount: parseFloat(formData.get(`transactions[${index}].amount`) as string),
      date: formData.get(`transactions[${index}].date`) as string
    }));

    try {
      const response = await fetch('/api/commissions/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: formData.get('partnerId'),
          commissionRate: parseFloat(formData.get('commissionRate') as string),
          transactions: transactionsData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate commissions');
      }

      setResults(data);
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Partner ID
            <input
              name="partnerId"
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </label>

          <label className="block text-sm font-medium text-gray-700">
            Commission Rate (%)
            <input
              name="commissionRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </label>
        </div>

        <div className="space-y-4">
          {transactions.map((transaction, index) => (
            <div key={index} className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Amount
                  <input
                    name={`transactions[${index}].amount`}
                    type="number"
                    step="0.01"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  Date
                  <input
                    name={`transactions[${index}].date`}
                    type="datetime-local"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </label>
              </div>

              {transactions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTransaction(index)}
                  className="mb-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addTransaction}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Add Transaction
          </button>
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Calculate Commissions
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-lg font-medium mb-2">Results</h3>
          <p className="font-semibold">
            Total Commission: €{results.totalCommission.toFixed(2)}
          </p>
          <div className="mt-4 space-y-2">
            {results.breakdown.map((item, index) => (
              <div key={index} className="text-sm">
                {new Date(item.date).toLocaleDateString()}: 
                €{item.amount.toFixed(2)} → €{item.commission.toFixed(2)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
