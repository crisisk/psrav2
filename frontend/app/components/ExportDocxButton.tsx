"use client";

import { useCallback } from 'react';

// Component props type
type ExportButtonProps = {
  className?: string;
};

export function ExportDocxButton({ className }: ExportButtonProps) {
  const handleExport = useCallback(async () => {
    try {
      const response = await fetch('/api/export-docx');
      
      if (!response.ok) {
        throw new Error('Export request failed');
      }

      // Create blob from response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assessment-report.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, []);

  return (
    <button
      onClick={handleExport}
      className={`
        bg-white text-gray-800 px-4 py-2 rounded
        border border-gray-300 hover:bg-gray-50
        transition-colors duration-200
        ${className}
      `}
      aria-label="Export as DOCX document"
    >
      Export als DOCX
    </button>
  );
}
