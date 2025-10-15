'use client';
import { useState } from 'react';

export default function ConvertLeadForm() {
  const [leadId, setLeadId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch(`/api/partners/leads/${leadId}/convert`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to convert lead');
      }

      setMessage(data.message);
      setLeadId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Convert Lead to Customer
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="leadId" className="block text-sm font-medium text-gray-700">
            Lead ID
          </label>
          <input
            id="leadId"
            type="text"
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                     focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent
                   rounded-md shadow-sm text-sm font-medium text-white
                   bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2
                   focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isLoading ? 'Processing...' : 'Convert Lead'}
        </button>

        {message && (
          <div className="p-3 text-sm text-green-700 bg-green-100 rounded-md">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
