'use client';

import { useState } from 'react';
import { z } from '@/lib/zod';

type CalculationResult = {
  totalScore: number;
  isCompliant: boolean;
  threshold: number;
  calculatedAt: string;
};

export function CalculationForm() {
  const [scores, setScores] = useState<string[]>(['']);
  const [weights, setWeights] = useState<string[]>(['']);
  const [threshold, setThreshold] = useState('75');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addCriteria = () => {
    setScores([...scores, '']);
    setWeights([...weights, '']);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const numericScores = scores.map(Number);
      const numericWeights = weights.map(Number);

      const response = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: 'current',
          scores: numericScores,
          weights: numericWeights,
          threshold: Number(threshold),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate compliance');
      }

      setResult(data.result);
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          {scores.map((_, index) => (
            <div key={index} className="flex gap-4">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="Score"
                className="flex-1 p-2 border rounded"
                value={scores[index]}
                onChange={(e) => {
                  const newScores = [...scores];
                  newScores[index] = e.target.value;
                  setScores(newScores);
                }}
              />
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Weight"
                className="flex-1 p-2 border rounded"
                value={weights[index]}
                onChange={(e) => {
                  const newWeights = [...weights];
                  newWeights[index] = e.target.value;
                  setWeights(newWeights);
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={addCriteria}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Add Criteria
          </button>
          
          <input
            type="number"
            min="0"
            max="100"
            placeholder="Threshold"
            className="p-2 border rounded"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Calculating...' : 'Calculate Compliance'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Results</h3>
          <p>Total Score: <span className="font-medium">{result.totalScore}%</span></p>
          <p>Status: <span className={`font-medium ${result.isCompliant ? 'text-green-600' : 'text-red-600'}`}>
            {result.isCompliant ? 'Compliant' : 'Non-compliant'}
          </span></p>
          <p className="text-sm text-gray-600 mt-2">
            Calculated at: {new Date(result.calculatedAt).toLocaleString()}
          </p>
        </div>
      )}
    </div>
  );
}
