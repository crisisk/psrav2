'use client';

import { useState } from 'react';
import axios from 'axios';

interface ProvisionButtonProps {
  userId: string;
  planType: 'basic' | 'premium';
  className?: string;
}

export default function ProvisionButton({
  userId,
  planType,
  className
}: ProvisionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleProvision = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await axios.post('/api/provision-access', {
        userId,
        planType
      });

      if (response.data.success) {
        setSuccess(true);
        // Optional: Redirect or refresh data here
      }
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data.error || 'Provisioning failed'
          : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        onClick={handleProvision}
        disabled={isLoading || success}
        className={`px-4 py-2 rounded-md text-white font-medium transition-colors
          ${isLoading || success
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isLoading ? (
          <span className='flex items-center'>
            <svg className='animate-spin -ml-1 mr-3 h-5 w-5 text-white' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24'>
              <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
              <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
            </svg>
            Processing...
          </span>
        ) : success ? (
          'Access Provisioned!'
        ) : (
          'Provision Access'
        )}
      </button>

      {error && (
        <p className='text-red-500 text-sm mt-2'>
          Error: {error}
        </p>
      )}

      {success && (
        <p className='text-green-500 text-sm mt-2'>
          Successfully provisioned {planType} access!
        </p>
      )}
    </div>
  );
}
