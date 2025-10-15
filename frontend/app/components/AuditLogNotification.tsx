'use client';

import { useState } from 'react';

type AuditLogNotificationProps = {
  sectionId: string;
  userId: string;
};

export function AuditLogNotification({ sectionId, userId }: AuditLogNotificationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/audit-logs/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sectionId,
          userId,
          completionTime: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to notify compliance team');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Notification failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Section Completion</h3>
        <p className="text-sm text-gray-600">
          Mark this section as completed and notify the compliance team.
        </p>
      </div>

      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${isLoading 
            ? 'bg-gray-300 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'}`}
      >
        {isLoading ? 'Processing...' : 'Mark as Completed'}
      </button>

      {error && (
        <div className="p-3 text-sm rounded-md bg-red-100 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-sm rounded-md bg-green-100 text-green-700">
          Successfully notified compliance team
        </div>
      )}
    </div>
  );
}
