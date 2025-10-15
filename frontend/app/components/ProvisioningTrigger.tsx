'use client';

import { useState } from 'react';

type ProvisioningRequest = {
  userId: string;
  resourceType: 'account' | 'workspace' | 'database';
};

export default function ProvisioningTrigger() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Example user ID - in real implementation would come from auth context
  const mockUserId = '550e8400-e29b-41d4-a716-446655440000';

  const triggerProvisioning = async (resourceType: ProvisioningRequest['resourceType']) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/provisioning/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: mockUserId,
          resourceType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to trigger provisioning');
      }

      setResult(`Workflow started: ${data.jobId}`);
    } catch (err) {
      console.error('Trigger error:', err);
      setError(err instanceof Error ? err.message : 'Failed to trigger workflow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Provisioning Workflows</h2>
      
      <div className="space-y-4">
        {['account', 'workspace', 'database'].map((resource) => (
          <button
            key={resource}
            onClick={() => triggerProvisioning(resource as ProvisioningRequest['resourceType'])}
            disabled={loading}
            className={`px-4 py-2 rounded-md ${loading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'} 
              transition-colors duration-200 capitalize`}
          >
            Provision {resource}
          </button>
        ))}
      </div>

      {loading && (
        <p className="mt-4 text-gray-600">Triggering provisioning workflow...</p>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
          {result}
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
    </div>
  );
}
