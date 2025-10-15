'use client';

import { useState } from 'react';

type ValidationResult = {
  valid: boolean;
  message: string;
} | null;

export default function EmailValidator() {
  const [email, setEmail] = useState('');
  const [result, setResult] = useState<ValidationResult>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const data: ValidationResult = await response.json();
      setResult(data);
    } catch (err) {
      setError('Failed to validate email. Please try again.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={validateEmail} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="text"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            disabled={loading}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Validating...' : 'Validate Email'}
        </button>

        {error && (
          <p className="mt-2 text-sm text-red-600">{error}</p>
        )}

        {result && (
          <div className={`mt-4 p-3 rounded-md ${result.valid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p className="text-sm">{result.message}</p>
          </div>
        )}
      </form>
    </div>
  );
}
