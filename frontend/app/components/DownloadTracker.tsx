'use client';

import { useState } from 'react';

type DownloadTrackerProps = {
  resourceId: string;
  userId: string;
  downloadUrl: string;
};

export default function DownloadTracker({
  resourceId,
  userId,
  downloadUrl,
}: DownloadTrackerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Record download
      const response = await fetch('/api/resource-downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to record download');
      }

      // Trigger actual file download
      window.location.href = downloadUrl;
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to initiate download. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? 'Processing...' : 'Download Resource'}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
