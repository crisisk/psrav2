'use client';

import { useState } from 'react';

export default function AuditLogsDownloadButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/audit-logs/download-template');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit-log-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download template. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md font-medium transition-colors ${
          isLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Generating Template...' : 'Download CSV Template'}
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
