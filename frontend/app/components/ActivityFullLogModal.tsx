'use client';

import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X } from 'lucide-react';

type ActivityLog = {
  id: string;
  timestamp: string;
  actionType: string;
  fullDetails: string;
  relatedEntity: string;
  ipAddress: string;
};

export function ActivityFullLogModal({ activityId }: { activityId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [logData, setLogData] = useState<ActivityLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFullLog = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/activities/${activityId}/full-log`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ActivityLog = await response.json();
      setLogData(data);
    } catch (err) {
      console.error('Failed to fetch full log:', err);
      setError('Failed to load full activity log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFullLog();
    }
  }, [isOpen]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          aria-label="View full activity log"
        >
          View Full Log
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 fixed inset-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-semibold">
              Full Activity Log
            </Dialog.Title>
            <Dialog.Close className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              <p>{error}</p>
            </div>
          )}

          {logData && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Timestamp</p>
                  <p className="text-sm text-gray-900">
                    {new Date(logData.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Action Type</p>
                  <p className="text-sm text-gray-900">{logData.actionType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Related Entity</p>
                  <p className="text-sm text-gray-900">{logData.relatedEntity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">IP Address</p>
                  <p className="text-sm text-gray-900">{logData.ipAddress}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Full Details</p>
                <div className="bg-gray-50 p-4 rounded-md">
                  <pre className="text-sm font-mono text-gray-900 whitespace-pre-wrap">
                    {logData.fullDetails}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
