'use client';

import { useState } from 'react';
import { z } from 'zod';

const sectionTypes = [
  { value: 'introduction', label: 'Introduction' },
  { value: 'methodology', label: 'Methodology' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'testing_procedures', label: 'Testing Procedures' },
  { value: 'conclusions', label: 'Conclusions' },
] as const;

export default function DocumentationGenerator() {
  const [context, setContext] = useState('');
  const [sectionType, setSectionType] = useState('introduction');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/documentation-sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionType, context }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Generation failed');
      }

      const data = await response.json();
      setGeneratedContent(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate content');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">Section Type</label>
          <select
            value={sectionType}
            onChange={(e) => setSectionType(e.target.value)}
            className="w-full p-2 border rounded-md bg-white"
            disabled={isLoading}
          >
            {sectionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Context</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Enter context for the section..."
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generating...' : 'Generate Section'}
        </button>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}
      </form>

      {generatedContent && (
        <div className="border-t pt-4">
          <h2 className="text-xl font-semibold mb-4">Generated Content</h2>
          <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
            {generatedContent}
          </div>
        </div>
      )}
    </div>
  );
}
