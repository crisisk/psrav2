'use client';

import { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/types';

export const statusOptions = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal',
  'Negotiation',
  'Won',
  'Lost',
] as const;

export default function AuditStatusFilter() {
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        setError(null);

        const url = selectedStatus === 'All'
          ? '/api/audit-logs'
          : `/api/audit-logs?status=${selectedStatus}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch logs');

        const data = await response.json();
        setLogs(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedStatus]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Audit Log Viewer</h1>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setSelectedStatus('All')}
            className={`px-4 py-2 rounded-lg ${
              selectedStatus === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-lg ${
                selectedStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {loading && <div className="text-gray-500">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>

      <div className="space-y-4">
        {logs.map((log) => (
          <div
            key={log.id}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium">{log.action}</span>
              <span className={`px-2 py-1 text-sm rounded ${
                log.status === 'Lost' ? 'bg-red-100 text-red-800' :
                log.status === 'Won' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {log.status}
              </span>
            </div>
            <p className="text-gray-600 text-sm">{log.details}</p>
            <div className="mt-2 text-xs text-gray-400">
              {new Date(log.timestamp).toLocaleString()} • User: {log.userId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
