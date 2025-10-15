'use client';

import { useState } from 'react';

interface BulkProvisionButtonProps {
  userIds: string[];
}

export function BulkProvisionButton({ userIds }: BulkProvisionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBulkProvision = async () => {
    try {
      if (userIds.length === 0) {
        setError('No users selected for provisioning');
        return;
      }

      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/bulk-provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to process bulk provision');
      }

      // Optional: Add success feedback or refresh data
      console.log(`Successfully provisioned ${data.provisionedCount} users`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleBulkProvision}
        disabled={isLoading}
        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors
          ${isLoading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isLoading ? 'Processing...' : 'Bulk Provision'}
      </button>

      {error && (
        <p className="text-sm text-red-600 mt-1">
          Error: {error}
        </p>
      )}
    </div>
  );
}
