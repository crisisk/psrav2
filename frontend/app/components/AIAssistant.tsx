'use client';

import { useState } from 'react';
import { z } from 'zod';

// Response validation schema
const aiResponseSchema = z.object({
  data: z.object({
    result: z.string(),
    confidence: z.number(),
    complianceStatus: z.enum(['FULL', 'PARTIAL', 'NONE']),
  }),
  success: z.boolean(),
});

export default function AIAssistant() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const validation = aiResponseSchema.safeParse(data);

      if (!validation.success) {
        throw new Error('Invalid response format');
      }

      setResult(validation.data.data.result);
    } catch (err) {
      console.error('AI request failed:', err);
      setError('Failed to get AI analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="block text-sm font-medium text-gray-700">
            Compliance Query
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1 p-2 w-full border rounded-md"
            rows={4}
            disabled={loading}
            placeholder="Enter your compliance question..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 text-white rounded-md ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Analyzing...' : 'Generate Assessment'}
        </button>

        {error && (
          <div className="p-3 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold mb-2">AI Analysis:</h3>
            <p className="whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </form>
    </div>
  );
}
