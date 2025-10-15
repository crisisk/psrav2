'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type Props = {
  auditLogId: number;
  onSuccess?: () => void;
};

export default function AuditLogSoftDeleteButton({ auditLogId, onSuccess }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSoftDelete = async () => {
    if (!confirm('Are you sure you want to archive this audit log?')) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/audit-logs/${auditLogId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to archive audit log');
      }

      onSuccess?.();
    } catch (error) {
      console.error('Archive failed:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to archive audit log'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSoftDelete}
        disabled={isDeleting}
        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed transition-colors"
      >
        {isDeleting ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Archiving...
          </span>
        ) : (
          'Archive Log'
        )}
      </button>

      {errorMessage && (
        <p className="text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}
