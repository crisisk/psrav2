"use client";
import { useState } from 'react';

type BulkActionsProps = {
  selectedIds: string[];
  onSuccess: () => void;
};

export function CertificateBulkActions({ selectedIds, onSuccess }: BulkActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.length === 0) {
      setError('No certificates selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/bulk/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      onSuccess();
    } catch (err) {
      console.error('Bulk action failed:', err);
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => handleBulkAction('approve')}
          disabled={loading || selectedIds.length === 0}
          className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-300' : 'bg-green-500 hover:bg-green-600'} text-white`}
        >
          {loading ? 'Processing...' : 'Approve Selected'}
        </button>

        <button
          onClick={() => handleBulkAction('reject')}
          disabled={loading || selectedIds.length === 0}
          className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-300' : 'bg-yellow-500 hover:bg-yellow-600'} text-white`}
        >
          Reject Selected
        </button>

        <button
          onClick={() => handleBulkAction('delete')}
          disabled={loading || selectedIds.length === 0}
          className={`px-4 py-2 rounded-md ${loading ? 'bg-gray-300' : 'bg-red-500 hover:bg-red-600'} text-white`}
        >
          Delete Selected
        </button>
      </div>

      {error && (
        <div className="text-red-500 p-3 bg-red-50 rounded-md">
          Error: {error}
        </div>
      )}
    </div>
  );
}
