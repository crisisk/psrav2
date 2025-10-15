'use client';

import { useState } from 'react';

export default function SendInvitationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendInvitation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Replace with actual email input logic
      const testEmail = 'recipient@example.com';

      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.email?._errors[0] || 'Failed to send invitation');
      }

      // Handle successful response
      console.log('Invitation sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSendInvitation}
        disabled={isLoading}
        className={`px-4 py-2 text-white rounded-md transition-colors ${
          isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Sending...' : 'Send Invitation'}
      </button>
      
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
