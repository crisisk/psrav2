'use client';

import { useState, useEffect } from 'react';

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  userId: string;
  // Add other relevant fields as needed
}

interface AuditLogTableProps {
  auditLogs: AuditLog[];
}

export function AuditLogTable({ auditLogs }: AuditLogTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Handle checkbox state changes
  const handleCheckboxChange = (logId: string) => {
    setSelectedIds(prev =>
      prev.includes(logId)
        ? prev.filter(id => id !== logId)
        : [...prev, logId]
    );
  };

  // Sync selection changes with API
  useEffect(() => {
    const updateSelection = async () => {
      try {
        const response = await fetch('/api/audit-logs/selection', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selectedIds),
        });

        if (!response.ok) {
          throw new Error('Failed to update selection');
        }
      } catch (error) {
        console.error('Selection update failed:', error);
      }
    };

    if (selectedIds.length > 0) {
      updateSelection();
    }
  }, [selectedIds]);

  if (!auditLogs?.length) {
    return (
      <div className="p-4 text-gray-500">
        No audit logs available
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500">
              {/* Header checkbox for bulk selection (optional) */}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Action
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              Timestamp
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
              User ID
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {auditLogs.map(log => (
            <tr
              key={log.id}
              className={`hover:bg-gray-50 ${
                selectedIds.includes(log.id) ? 'bg-blue-50' : ''
              }`}
            >
              <td className="whitespace-nowrap px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(log.id)}
                  onChange={() => handleCheckboxChange(log.id)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  aria-label={`Select log entry ${log.id}`}
                />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {log.action}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                {log.userId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
