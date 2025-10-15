'use client';

import { useState } from 'react';

// Primary CTA button for certificate creation
export default function CreateCertificateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateCertificate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/certificates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create certificate');
      }

      // Handle successful creation (e.g., refresh list or redirect)
      console.log('New certificate ID:', data.certificateId);
      // TODO: Add actual success handling

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleCreateCertificate}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md font-medium transition-colors
          ${isLoading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'}
        `}
      >
        {isLoading ? 'Creating...' : 'Create New Certificate'}
      </button>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
