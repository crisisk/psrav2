'use client';
import { useState } from 'react';
import { ValidationResult } from '@/lib/validations/article11';

export default function Article11Validation() {
  const [results, setResults] = useState<ValidationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const assessmentData = {
      documentId: formData.get('documentId'),
      expiryDate: new Date(formData.get('expiryDate') as string).toISOString(),
      assessorId: formData.get('assessorId'),
      assessmentDate: new Date().toISOString()
    };

    try {
      const response = await fetch('/api/assessments/validate-article11', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assessmentData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Validation failed');
      }

      const data: ValidationResult = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Article 11 Compliance Check</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document ID
          </label>
          <input
            name="documentId"
            type="text"
            required
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiry Date
          </label>
          <input
            name="expiryDate"
            type="date"
            required
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessor ID
          </label>
          <input
            name="assessorId"
            type="text"
            required
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Validating...' : 'Verify Compliance'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {results && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold mb-3">Validation Results</h2>
          <p className={`mb-4 ${results.isValid ? 'text-green-600' : 'text-red-600'}`}>
            Overall Status: {results.isValid ? 'Compliant' : 'Non-compliant'}
          </p>
          
          <div className="space-y-3">
            {results.requirements.map((req) => (
              <div
                key={req.id}
                className={`p-3 rounded-md ${req.isValid ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <p className="font-medium">{req.id}: {req.description}</p>
                {!req.isValid && (
                  <p className="text-sm mt-1">Error: {req.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
