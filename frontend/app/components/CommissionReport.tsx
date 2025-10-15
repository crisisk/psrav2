'use client';

import { useEffect, useState } from 'react';
import type { CommissionReport } from '@/types/commissions';

export default function CommissionReport() {
  const [report, setReport] = useState<CommissionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/commissions?startDate=2024-03-01&endDate=2024-03-31');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load commission report');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Loading commission report...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h2 className="text-lg font-semibold">
          Commission Report ({report.periodStart.toLocaleDateString()} - {report.periodEnd.toLocaleDateString()})
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Total Commission: ${report.totalCommission.toFixed(2)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction Date</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {report.entries.map((entry) => (
              <tr key={entry.partnerId}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium">{entry.partnerName}</div>
                  <div className="text-sm text-gray-500">{entry.partnerId}</div>
                </td>
                <td className="px-6 py-4 text-sm">
                  {entry.transactionDate.toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  ${entry.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  ${entry.commissionAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
