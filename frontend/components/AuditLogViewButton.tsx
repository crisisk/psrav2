'use client';

import { useState } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

type AuditLogViewButtonProps = {
  auditLogId: string;
};

export function AuditLogViewButton({ auditLogId }: AuditLogViewButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleView = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/audit-logs/view', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auditLogId }),
      });

      if (!response.ok) {
        throw new Error('Failed to log view');
      }

      toast.success('View logged successfully');
    } catch (error) {
      console.error('View logging failed:', error);
      toast.error('Could not log view');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleView}
      disabled={isLoading}
      className="text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="View audit log details"
    >
      <EyeIcon className="h-5 w-5" />
    </button>
  );
}
