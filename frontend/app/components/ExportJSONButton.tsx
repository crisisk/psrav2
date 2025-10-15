'use client';

import { MouseEvent } from 'react';

export default function ExportJSONButton() {
  const handleExport = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/export/json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'assessments-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300
                 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      Export als JSON
    </button>
  );
}
