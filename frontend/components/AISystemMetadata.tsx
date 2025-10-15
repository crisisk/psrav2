'use client';

import { useEffect, useState } from 'react';
import type { AISystemMetadata } from '@/app/api/ai-system-metadata/route';

interface MetadataResponse {
  data: AISystemMetadata[];
}

export default function AISystemMetadata() {
  const [metadata, setMetadata] = useState<AISystemMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metadata on component mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/ai-system-metadata');
        if (!response.ok) throw new Error('Failed to fetch');
        const data: MetadataResponse = await response.json();
        setMetadata(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/ai-system-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSource: formData.get('dataSource'),
          generationDate: new Date().toISOString(),
          version: formData.get('version'),
          origin: formData.get('origin'),
        }),
      });

      if (!response.ok) throw new Error('Submission failed');
      const result = await response.json();
      setMetadata([...metadata, result.data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission error');
    }
  };

  if (loading) return <div className='p-4 text-gray-600'>Loading...</div>;
  if (error) return <div className='p-4 text-red-500'>Error: {error}</div>;

  return (
    <div className='max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold mb-6 text-gray-800'>
        AI System Metadata
      </h2>

      {/* Metadata Display */}
      <div className='mb-8'>
        <h3 className='text-xl font-semibold mb-4'>Current Metadata</h3>
        <div className='grid grid-cols-2 gap-4'>
          {metadata.map((item, index) => (
            <div
              key={index}
              className='p-4 border rounded-lg bg-gray-50'
            >
              <p className='font-medium'>Source: {item.dataSource}</p>
              <p>Version: {item.version}</p>
              <p>Origin: {item.origin}</p>
              <p className='text-sm text-gray-500'>
                Generated: {new Date(item.generationDate).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata Submission Form */}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Data Source
              <input
                name='dataSource'
                type='text'
                required
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              />
            </label>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Version
              <input
                name='version'
                type='text'
                required
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              />
            </label>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Origin
              <select
                name='origin'
                required
                className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
              >
                <option value='manual'>Manual</option>
                <option value='automated'>Automated</option>
                <option value='third-party'>Third Party</option>
              </select>
            </label>
          </div>
        </div>

        <button
          type='submit'
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        >
          Add Metadata Entry
        </button>
      </form>
    </div>
  );
}
