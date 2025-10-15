'use client';

import { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

export default function AutoGenerateButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual document ID and missing sections retrieval
      const response = await fetch('/api/generate-missing-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: 'current-document-id',
          missingSections: ['section-1', 'section-2']
        })
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const data = await response.json();
      console.log('Generated sections:', data.generatedSections);
      // TODO: Implement section insertion logic

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate sections');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors
          ${isLoading
            ? 'bg-teal-400 cursor-not-allowed'
            : 'bg-teal-600 hover:bg-teal-700'}
          text-white flex items-center justify-center gap-2`}
      >
        <SparklesIcon className={`w-6 h-6 ${isLoading ? 'animate-pulse' : ''}`} />
        {isLoading ? 'Generating...' : 'Auto-Generate Missing Sections'}
      </button>

      {error && (
        <p className="text-red-500 text-sm text-center">
          Error: {error}. Please try again.
        </p>
      )}
    </div>
  );
}
