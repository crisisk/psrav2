'use client';

import { useEffect, useState } from 'react';
import { AuditLogStatus } from '@/lib/types/audit-log-status';

export default function StatusFilterDropdown() {
  const [statuses, setStatuses] = useState<AuditLogStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await fetch('/api/audit-logs/statuses');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: AuditLogStatus[] = await response.json();
        
        // Validate response structure
        if (!Array.isArray(data) || data.some(item => !item.value || !item.label)) {
          throw new Error('Invalid response format');
        }

        setStatuses(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch statuses:', err);
        setError('Failed to load status filters');
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  if (error) {
    return <div className="text-red-500 text-sm">{error}</div>;
  }

  return (
    <div className="relative w-48">
      <select
        disabled={loading}
        className="w-full px-4 py-2 border rounded-md bg-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed"
        defaultValue="all"
      >
        {loading ? (
          <option value="loading">Loading statuses...</option>
        ) : (
          statuses.map((status) => (
            <option key={status.value} value={status.value}>
              Status: {status.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
