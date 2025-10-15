'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type ExportFormat = 'xlsx' | 'csv' | 'pdf';

export function AuditLogExport() {
  const [isLoading, setIsLoading] = useState<Record<ExportFormat, boolean>>({
    xlsx: false,
    csv: false,
    pdf: false,
  });

  const handleExport = async (format: ExportFormat) => {
    try {
      setIsLoading(prev => ({ ...prev, [format]: true }));
      
      const response = await fetch(`/api/audit-logs/export?format=${format}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || `audit-logs.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export audit logs');
    } finally {
      setIsLoading(prev => ({ ...prev, [format]: false }));
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        onClick={() => handleExport('xlsx')}
        disabled={isLoading.xlsx}
        className="bg-green-600 hover:bg-green-700 disabled:bg-green-300"
      >
        {isLoading.xlsx ? 'Exporting...' : 'Export XLSX'}
      </Button>

      <Button
        onClick={() => handleExport('csv')}
        disabled={isLoading.csv}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
      >
        {isLoading.csv ? 'Exporting...' : 'Export CSV'}
      </Button>

      <Button
        onClick={() => handleExport('pdf')}
        disabled={isLoading.pdf}
        className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
      >
        {isLoading.pdf ? 'Exporting...' : 'Export PDF'}
      </Button>
    </div>
  );
}
