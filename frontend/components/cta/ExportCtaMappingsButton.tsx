'use client';

import { useState } from 'react';
import axios from 'axios';

export interface ExportCtaMappingsButtonProps {
  apiKey: string;
}

export function ExportCtaMappingsButton({ apiKey }: ExportCtaMappingsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get('/api/cta-mapping/export', {
        headers: {
          'x-api-key': apiKey
        },
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cta-mappings-export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export CTA mappings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExport}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md ${isLoading 
          ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {isLoading ? 'Exporting...' : 'Export CSV'}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
