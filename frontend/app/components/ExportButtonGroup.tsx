'use client';

import { useState } from 'react';

type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export default function ExportButtonGroup() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExport = async (format: ExportFormat) => {
    try {
      const response = await fetch(`/api/export/${format}`);
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `assessments.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to export data');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={() => handleExport('xlsx')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Export XLSX
        </button>
        
        <button
          onClick={() => handleExport('csv')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Export CSV
        </button>
        
        <button
          onClick={() => handleExport('pdf')}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Export PDF
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-100 text-red-700 rounded">
          Error: {errorMessage}
        </div>
      )}
    </div>
  );
}
