'use client';

import { useEffect, useState } from 'react';

interface CalculationResult {
  totalLogs: number;
  averageDuration: number;
  successPercentage: number;
}

export default function AuditLogCalculations() {
  const [data, setData] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalculations = async () => {
      try {
        const response = await fetch('/api/audit-logs/calculations');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchCalculations();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-gray-600">
        Loading calculations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-50 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg mb-6">
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Total Logs</h3>
        <p className="text-2xl font-bold">{data?.totalLogs}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Avg Duration (ms)</h3>
        <p className="text-2xl font-bold">{data?.averageDuration}</p>
      </div>
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-sm font-semibold text-gray-500 mb-2">Success Rate</h3>
        <p className="text-2xl font-bold">{data?.successPercentage}%</p>
      </div>
    </div>
  );
}
