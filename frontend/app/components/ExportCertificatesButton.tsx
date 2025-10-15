'use client';

import { useState } from 'react';

export default function ExportCertificatesButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch('/api/certificates/export');

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Create blob from response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'certificate_audit_logs.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export certificate logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
        ${isExporting 
          ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-blue-600 text-white hover:bg-blue-700'}`}
    >
      {isExporting ? 'Exporting...' : 'Export Certificate Logs'}
    </button>
  );
}
