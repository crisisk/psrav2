'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface LeadConverterProps {
  leadId: string;
  partnerId: string;
}

export function LeadConverter({ leadId, partnerId }: LeadConverterProps) {
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    customerId?: string;
    error?: string;
  } | null>(null);

  const handleConversion = async () => {
    setIsConverting(true);
    setResult(null);

    try {
      const response = await fetch(`/api/leads/${encodeURIComponent(leadId)}/convert`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ partnerId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert lead');
      }

      setResult(data);
    } catch (error) {
      console.error('Conversion error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleConversion}
        disabled={isConverting}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConverting ? 'Converting...' : 'Convert to Customer'}
      </Button>

      {result && (
        <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {result.success ? (
            <p>Lead converted successfully! Customer ID: {result.customerId}</p>
          ) : (
            <p>Error: {result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
