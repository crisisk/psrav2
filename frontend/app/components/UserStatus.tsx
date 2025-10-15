'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type StatusResponse = {
  userId: string;
  status: 'active' | 'inactive' | 'suspended';
  lastChecked: string;
};

type StatusBadgeProps = {
  status: 'active' | 'inactive' | 'suspended';
};

export function UserStatus({ userId }: { userId: string }) {
  const [statusData, setStatusData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/users/${userId}/status`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: StatusResponse = await response.json();
        setStatusData(data);
      } catch (err) {
        console.error('Failed to fetch user status:', err);
        setError('Failed to load user status');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking account status...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-100 px-3 py-1 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={statusData?.status || 'inactive'} />
      <span className="text-sm text-gray-600">
        Last checked: {new Date(statusData?.lastChecked || '').toLocaleString()}
      </span>
    </div>
  );
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-yellow-100 text-yellow-800',
    suspended: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-3 py-1 rounded-md text-sm font-medium ${statusStyles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
