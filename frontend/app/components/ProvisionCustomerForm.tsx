"use client";

import { useState } from 'react';

type AccessLevel = 'basic' | 'premium' | 'enterprise';

interface ProvisionFormState {
  partnerId: string;
  customerId: string;
  accessLevel: AccessLevel;
}

export default function ProvisionCustomerForm() {
  const [formState, setFormState] = useState<ProvisionFormState>({
    partnerId: '',
    customerId: '',
    accessLevel: 'basic',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/provision-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formState),
      });

      const data = await response.json();
      setResult({
        success: data.success,
        message: data.message,
      });
    } catch (error) {
      console.error('Provisioning failed:', error);
      setResult({
        success: false,
        message: 'Failed to provision customer access',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Provision Customer Access</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Partner ID
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              value={formState.partnerId}
              onChange={e => setFormState(prev => ({ ...prev, partnerId: e.target.value }))}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Customer ID
            <input
              type="text"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              value={formState.customerId}
              onChange={e => setFormState(prev => ({ ...prev, customerId: e.target.value }))}
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Access Level
            <select
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              value={formState.accessLevel}
              onChange={e =>
                setFormState(prev => ({
                  ...prev,
                  accessLevel: e.target.value as AccessLevel,
                }))
              }
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Provisioning...' : 'Provision Access'}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 p-3 rounded-md ${
            result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
