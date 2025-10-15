'use client';

import { useState } from 'react';

export default function AuditExportButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audit_logs.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md transition-colors ${
          isLoading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isLoading ? 'Generating Report...' : 'Export to Excel'}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm mt-2">
          Error: {error}
        </p>
      )}
    </div>
  );
}
