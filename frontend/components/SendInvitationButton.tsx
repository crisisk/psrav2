'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface InvitationParams {
  email: string;
  role: 'viewer' | 'editor' | 'admin';
}

export default function SendInvitationButton() {
  const [isLoading, setIsLoading] = useState(false);

  const sendInvitation = async ({ email, role }: InvitationParams) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully!');
    } catch (error) {
      console.error('Invitation error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // For demonstration - replace with actual form integration
  const demoInvitation = () => {
    sendInvitation({
      email: 'user@example.com',
      role: 'viewer'
    });
  };

  return (
    <button
      onClick={demoInvitation}
      disabled={isLoading}
      className={`px-4 py-2 rounded-lg text-white font-medium transition-colors
        ${isLoading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'}`}
    >
      {isLoading ? 'Sending...' : 'Send Invitation'}
    </button>
  );
}
