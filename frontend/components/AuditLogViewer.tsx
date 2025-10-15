'use client';

import { useEffect, useState } from 'react';
import { StatusType } from '@/lib/types/status';

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  createdAt: Date;
  status: StatusType;
  details?: string;
}

interface ApiResponse {
  data: AuditLog[];
  message: string;
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<StatusType>('all');

  const fetchLogs = async (status: StatusType) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/audit-logs?status=${status}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data: ApiResponse = await response.json();
      setLogs(data.data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(selectedStatus);
  }, [selectedStatus]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Audit Log Viewer</h1>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as StatusType)}
          className="px-4 py-2 border rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {['all', 'draft', 'pending', 'approved', 'rejected', 'expired'].map((status) => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading logs...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.action}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.userId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        {
                          draft: 'bg-yellow-100 text-yellow-800',
                          pending: 'bg-blue-100 text-blue-800',
                          approved: 'bg-green-100 text-green-800',
                          rejected: 'bg-red-100 text-red-800',
                          expired: 'bg-gray-100 text-gray-800',
                        }[log.status as Exclude<StatusType, 'all'>] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div className="text-center py-4 text-gray-500">No logs found for this filter</div>
          )}
        </div>
      )}
    </div>
  );
}
