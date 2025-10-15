'use client';

import { useState, FormEvent } from 'react';

interface DocumentationResponse {
  success: boolean;
  message?: string;
  generatedDocument?: {
    systemId: string;
    sections: Array<{ name: string; content: string }>;
    generatedBy: string;
    timestamp: string;
  };
  error?: string;
}

export default function AutoDocumentationGenerator() {
  const [systemId, setSystemId] = useState('');
  const [sections, setSections] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DocumentationResponse | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/auto-generate-documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_id: systemId,
          sections: sections.split(',').map(s => s.trim()),
          user_id: userId
        }),
      });

      const data: DocumentationResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate documentation');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Auto-Generate Documentation</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            System ID
          </label>
          <input
            type="text"
            value={systemId}
            onChange={(e) => setSystemId(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sections (comma-separated)
          </label>
          <input
            type="text"
            value={sections}
            onChange={(e) => setSections(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 text-white font-medium rounded-md ${loading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Generating...' : 'Generate Documentation'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {result?.generatedDocument && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Generated Document:</h2>
          <pre className="whitespace-pre-wrap text-sm">
            {JSON.stringify(result.generatedDocument, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
