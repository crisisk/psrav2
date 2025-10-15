'use client';

import { useEffect, useState } from 'react';
import { AccountStatusResponse } from '@/app/api/account/status/route';

export default function AccountStatus() {
  const [statusData, setStatusData] = useState<AccountStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/account/status');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: AccountStatusResponse = await response.json();
        setStatusData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch account status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-600">Loading account status...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error: {error}
      </div>
    );
  }

  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Account Status</h2>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusStyles[statusData!.status]}`}>
            {statusData!.status.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            Last updated: {new Date(statusData!.statusUpdatedAt).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm ${statusData!.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
            {statusData!.emailVerified ? '✓ Email verified' : '⚠ Email verification pending'}
          </span>
        </div>
      </div>
    </div>
  );
}
