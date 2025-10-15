'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type AuditLogOptions = {
  actions: string[];
  users: Array<{ id: string; name: string }>;
  dateRange: { minDate: string; maxDate: string };
};

export default function AuditLogOptions() {
  const [options, setOptions] = useState<AuditLogOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch('/api/audit-logs/options');
        if (!response.ok) throw new Error('Failed to fetch options');
        const data = await response.json();
        setOptions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 text-red-600">
        Error loading options: {error}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="space-y-6">
        {/* Action Type Filter */}
        <div>
          <h3 className="mb-3 text-sm font-medium">Action Type</h3>
          <div className="flex flex-wrap gap-2">
            {options?.actions.map((action) => (
              <button
                key={action}
                className="rounded-full bg-muted px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* User Filter */}
        <div>
          <h3 className="mb-3 text-sm font-medium">User</h3>
          <div className="flex flex-wrap gap-2">
            {options?.users.map((user) => (
              <button
                key={user.id}
                className="rounded-full bg-muted px-4 py-2 text-sm transition-colors hover:bg-accent"
              >
                {user.name}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range Display */}
        <div className="text-sm text-muted-foreground">
          Available dates: {options?.dateRange.minDate} to{' '}
          {options?.dateRange.maxDate}
        </div>
      </div>
    </div>
  );
}
