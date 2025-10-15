"use client";

import { useState } from 'react';

export default function TierConfirmationForm() {
  const [email, setEmail] = useState('');
  const [tier, setTier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', content: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tier })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send confirmation');
      }

      setMessage({ type: 'success', content: data.message });
      setEmail('');
      setTier('');
    } catch (error) {
      setMessage({
        type: 'error',
        content: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Confirm Tier Subscription</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="tier" className="block text-sm font-medium text-gray-700 mb-1">
            Subscription Tier
          </label>
          <select
            id="tier"
            value={tier}
            onChange={(e) => setTier(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a tier</option>
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending...' : 'Confirm Subscription'}
        </button>

        {message && (
          <div className={`p-3 rounded-md ${message.type === 'success' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'}`}
          >
            {message.content}
          </div>
        )}
      </form>
    </div>
  );
}
