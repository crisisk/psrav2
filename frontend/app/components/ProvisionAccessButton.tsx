'use client';

import { useState } from 'react';

export default function ProvisionAccessButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleProvisionAccess = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/provision-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: 'NEW_CUSTOMER_123' // In real scenario, pass dynamic value
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to provision access');
      }

      setMessage(data.message);
    } catch (error) {
      console.error('Provisioning failed:', error);
      setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md">
      <button
        onClick={handleProvisionAccess}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg
                 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isLoading ? 'Provisioning...' : 'Provision Access'}
      </button>
      
      {message && (
        <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
