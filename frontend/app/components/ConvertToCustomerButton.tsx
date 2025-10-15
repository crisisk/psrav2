'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

type ConvertToCustomerButtonProps = {
  leadId: string;
};

export function ConvertToCustomerButton({ leadId }: ConvertToCustomerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConvert = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert lead');
      }

      // Refresh or update state as needed
      window.location.reload(); // Simple approach for demonstration
    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert lead');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleConvert}
        disabled={isLoading}
        className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors
          ${isLoading
            ? 'bg-green-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
          }`}
      >
        {isLoading ? (
          <span className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Converting...
          </span>
        ) : (
          'Convert to Customer'
        )}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
