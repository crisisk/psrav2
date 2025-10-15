'use client';
import { useState } from 'react';

type DocumentationType = 'technical' | 'compliance' | 'process';

export default function AIDocumentationGenerator() {
  const [content, setContent] = useState('');
  const [docType, setDocType] = useState<DocumentationType>('technical');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai-documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentationType: docType, content })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate documentation');
      }

      const data = await response.json();
      setResult(data.documentation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">AI Documentation Generator</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Documentation Type
          </label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentationType)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="technical">Technical Documentation</option>
            <option value="compliance">Compliance Report</option>
            <option value="process">Process Description</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Content
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md h-32 focus:ring-2 focus:ring-blue-500"
            placeholder="Enter content to document..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Documentation'}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-semibold mb-2">Generated Documentation:</h3>
            <pre className="whitespace-pre-wrap font-sans">{result}</pre>
          </div>
        )}
      </form>
    </div>
  );
}
