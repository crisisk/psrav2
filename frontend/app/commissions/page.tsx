// CommissionReportPage.tsx
"use client";

import { useEffect, useState } from 'react';
import { CommissionReport } from '@/app/api/commissions/route';

interface ApiResponse {
  status: number;
  data: CommissionReport[];
  message: string;
}

export default function CommissionReportPage() {
  const [reports, setReports] = useState<CommissionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommissionReports = async () => {
      try {
        const response = await fetch('/api/commissions');
        const data: ApiResponse = await response.json();

        if (!response.ok || data.status !== 200) {
          throw new Error(data.message || 'Failed to fetch commission reports');
        }

        setReports(data.data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setReports([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommissionReports();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading commission reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-red-500 p-4 border border-red-500 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8 text-gray-800">Commission Reports</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Number</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.agentName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.policyNumber}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  €{report.commissionAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(report.calculationDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      report.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : report.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {report.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
