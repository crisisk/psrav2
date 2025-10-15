'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SkipOnboardingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  const handleSkip = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/onboarding/skip', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to skip onboarding');
      }

      router.refresh();
    } catch (err) {
      console.error('Skip onboarding failed:', err);
      setError('Failed to skip onboarding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSkip}
        disabled={isLoading}
        className={`px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isLoading ? 'Processing...' : 'Skip Onboarding'}
      </button>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
