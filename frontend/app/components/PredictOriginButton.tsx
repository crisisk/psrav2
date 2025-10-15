import { GlobeAmericasIcon } from '@heroicons/react/24/outline';
import { useTransition } from 'react';

type PredictionResponse = {
  success: boolean;
  data?: {
    country: string;
    region: string;
    confidence: number;
  };
  error?: string;
};

export default function PredictOriginButton({ logId }: { logId: string }) {
  const [isPending, startTransition] = useTransition();

  const handlePrediction = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/predict-origin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ logId }),
        });

        const result: PredictionResponse = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Failed to predict origin');
        }

        // Handle successful prediction - could be replaced with state update
        alert(`Predicted origin: ${result.data?.region}, ${result.data?.country} (Confidence: ${result.data?.confidence}%)`);
      } catch (error) {
        console.error('Prediction failed:', error);
        alert(error instanceof Error ? error.message : 'Prediction failed');
      }
    });
  };

  return (
    <button
      onClick={handlePrediction}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
    >
      {isPending ? (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <GlobeAmericasIcon className="h-4 w-4" />
      )}
      <span>{isPending ? 'Predicting...' : 'Predict Origin'}</span>
    </button>
  );
}
