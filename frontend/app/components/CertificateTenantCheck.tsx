'use client';

import { useState } from 'react';

interface ValidationResult {
  valid: boolean;
  message: string;
}

export default function CertificateTenantCheck() {
  const [certificateIds, setCertificateIds] = useState<string>('');
  const [tenantId, setTenantId] = useState<string>('');
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const idsArray = certificateIds
        .split(/[,\s]+/)
        .filter(id => id.trim() !== '');

      const response = await fetch('/api/certificates/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificateIds: idsArray,
          tenantId: tenantId
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ValidationResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Validation failed:', err);
      setError('Failed to validate certificates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Certificate Tenant Validation</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tenant ID
          </label>
          <input
            type="text"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter tenant UUID"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Certificate IDs (comma or space separated)
          </label>
          <textarea
            value={certificateIds}
            onChange={(e) => setCertificateIds(e.target.value)}
            className="w-full p-2 border rounded-md h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter certificate UUIDs"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 text-white font-medium rounded-md ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? 'Validating...' : 'Validate Certificates'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className={`mt-4 p-4 rounded-md ${result.valid ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
          {result.message}
        </div>
      )}
    </div>
  );
}
