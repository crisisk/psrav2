import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { trackEvent } from '@/shared/lib/telemetry';

interface ExportButtonProps {
  assessmentId: string;
  format: 'pdf' | 'json' | 'csv';
  data: any;
}

export function ExportButton({ assessmentId, format, data }: ExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const convertToCSV = (data: any) => {
    if (!data || typeof data !== 'object') {
      return '';
    }

    // Handle array of objects
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row: any) => Object.values(row).join(','));
      return [headers, ...rows].join('\n');
    }

    // Handle single object
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).join(',');
    return `${headers}\n${values}`;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const text = JSON.stringify(data, null, 2);
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 15, 15);
    return doc.output('blob');
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      trackEvent('export_action', { format, assessmentId });

      let blob: Blob;
      let filename = `assessment-${assessmentId}`;

      // Generate file content based on format
      if (format === 'pdf') {
        blob = generatePDF();
        filename += '.pdf';
      } else if (format === 'json') {
        blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        filename += '.json';
      } else {
        blob = new Blob([convertToCSV(data)], { type: 'text/csv' });
        filename += '.csv';
      }

      // POST to export endpoint
      await fetch(`/api/assessments/${assessmentId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format })
      });

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      <Download className="h-4 w-4" />
      {isLoading ? 'Exporting...' : `Export ${format.toUpperCase()}`}
    </button>
  );
}

export default ExportButton;
