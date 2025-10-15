'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

type Props = {
  resourceId: number;
  downloadUrl: string;
};

export default function DownloadTracker({ resourceId, downloadUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();

  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);

      // Track download attempt
      const response = await fetch(`/api/resources/${resourceId}/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward current path for analytics
          'X-Current-Path': pathname
        }
      });

      if (!response.ok) {
        throw new Error('Failed to track download');
      }

      // Trigger actual download
      window.location.assign(downloadUrl);

    } catch (err) {
      console.error('Download tracking failed:', err);
      setError('Failed to initiate download. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleDownload}
        disabled={loading}
        className={`px-4 py-2 text-white rounded-md ${loading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'
        } transition-colors`}
      >
        {loading ? 'Preparing Download...' : 'Download Resource'}
      </button>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
