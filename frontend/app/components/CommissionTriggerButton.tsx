'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type CommissionTriggerProps = {
  dealId: string;
  userId: string;
  dealAmount: number;
};

export function CommissionTriggerButton({ dealId, userId, dealAmount }: CommissionTriggerProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCommissionCalculation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/commissions/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dealId,
          userId,
          amount: dealAmount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate commission');
      }

      const data = await response.json();
      toast.success(`Commission calculated: €${data.data.commission.toFixed(2)}`);
    } catch (error) {
      console.error('Commission calculation failed:', error);
      toast.error('Failed to calculate commission');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCommissionCalculation}
      disabled={isLoading}
      className={`px-4 py-2 rounded-md transition-colors
        ${isLoading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Calculating...
        </span>
      ) : (
        'Calculate Commission'
      )}
    </button>
  );
}
