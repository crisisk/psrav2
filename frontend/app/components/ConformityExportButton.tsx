'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type ExportFormat = 'pdf' | 'csv';

const exportSchema = z.object({
  assessmentId: z.string().min(1, 'Required'),
  format: z.enum(['pdf', 'csv']).default('pdf')
});

type ExportFormValues = z.infer<typeof exportSchema>;

export function ConformityExportButton({
  assessmentId
}: {
  assessmentId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { handleSubmit, register } = useForm<ExportFormValues>({
    resolver: zodResolver(exportSchema),
    defaultValues: {
      assessmentId,
      format: 'pdf'
    }
  });

  const onSubmit = async (data: ExportFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/conformity-assessments/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(await response.text() || 'Export failed');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conformity-export-${Date.now()}.${data.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Export error:', err);
      setError(err instanceof Error ? err.message : 'Failed to export');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-end">
        <div className="flex-1">
          <input
            type="hidden"
            {...register('assessmentId')}
          />
          
          <label className="block text-sm font-medium mb-1">
            Format
            <select
              {...register('format')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              disabled={isLoading}
            >
              <option value="pdf">PDF</option>
              <option value="csv">CSV</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Exporting...' : 'Export Report'}
        </button>
      </form>

      {error && (
        <div className="mt-2 text-red-600 text-sm">
          Error: {error}
        </div>
      )}
    </div>
  );
}
