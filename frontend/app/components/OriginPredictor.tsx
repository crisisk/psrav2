'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';

// Type definitions
interface PredictionResult {
  origin: string;
  confidence: number;
  timestamp: string;
}

interface PredictionForm {
  text: string;
}

export default function OriginPredictor() {
  const { register, handleSubmit, formState: { errors } } = useForm<PredictionForm>();
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: PredictionForm) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/origin-predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: data.text }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Prediction failed');
      }

      const prediction = await response.json();
      setResult(prediction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="text" className="block text-sm font-medium text-gray-700">
            Audit Text
          </label>
          <textarea
            id="text"
            {...register('text', { required: 'Text is required' })}
            className={`mt-1 block w-full rounded-md ${errors.text ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            rows={4}
          />
          {errors.text && (
            <p className="mt-2 text-sm text-red-600">{errors.text.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? 'Predicting...' : 'Predict Origin'}
        </button>
      </form>

      {loading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Prediction Result</h3>
          <dl className="grid grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Origin</dt>
              <dd className="mt-1 text-sm text-gray-900">{result.origin}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Confidence</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {(result.confidence * 100).toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(result.timestamp).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
