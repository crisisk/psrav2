'use client';
import { useState } from 'react';

type CommissionResult = {
  success: boolean;
  commission?: number;
  error?: string;
};

export default function CommissionCalculator() {
  const [formData, setFormData] = useState({
    partnerId: '',
    startDate: '',
    endDate: '',
    salesAmount: ''
  });
  const [result, setResult] = useState<CommissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/commissions/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salesAmount: parseFloat(formData.salesAmount)
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Calculation failed');

      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Partner ID</label>
          <input
            type="text"
            value={formData.partnerId}
            onChange={(e) => setFormData({...formData, partnerId: e.target.value})}
            className="mt-1 block w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
            className="mt-1 block w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
            className="mt-1 block w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sales Amount (€)</label>
          <input
            type="number"
            step="0.01"
            value={formData.salesAmount}
            onChange={(e) => setFormData({...formData, salesAmount: e.target.value})}
            className="mt-1 block w-full p-2 border rounded-md"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? 'Calculating...' : 'Calculate Commission'}
        </button>
      </form>

      {result && (
        <div className={`mt-4 p-4 rounded-md ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
          {result.success ? (
            <p className="text-green-800">
              Commission: €{result.commission?.toFixed(2)}
            </p>
          ) : (
            <p className="text-red-800">Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
