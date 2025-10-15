"use client";

import { useState } from 'react';

interface TierConfirmationButtonProps {
  assessmentId: string;
  tier: string;
  email: string;
}

export const TierConfirmationButton = ({
  assessmentId,
  tier,
  email,
}: TierConfirmationButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSendConfirmation = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/tier-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessmentId,
          tier,
          email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.details || 'Failed to send confirmation');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Confirmation error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred'
      );
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSendConfirmation}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white font-medium transition-colors
          ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isLoading ? 'Sending...' : 'Send Tier Confirmation'}
      </button>

      {success && (
        <p className="text-green-600 text-sm">
          Confirmation email sent successfully!
        </p>
      )}

      {error && (
        <p className="text-red-600 text-sm">
          Error: {error}
        </p>
      )}
    </div>
  );
};
