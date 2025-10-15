'use client';

import { useState, useEffect } from 'react';
import { PasswordStrengthResponse } from '@/lib/types/password';

export default function PasswordStrengthChecker() {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState<PasswordStrengthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStrength = async () => {
      if (password.length === 0) {
        setStrength(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/password-strength', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        if (!response.ok) {
          throw new Error('Failed to check password strength');
        }

        const data: PasswordStrengthResponse = await response.json();
        setStrength(data);
      } catch (err) {
        setError('Failed to check password strength. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce API calls
    const timeoutId = setTimeout(checkStrength, 500);
    return () => clearTimeout(timeoutId);
  }, [password]);

  const getStrengthColor = () => {
    if (!strength) return 'border-gray-300';
    return strength.isValid ? 'border-green-500' : 'border-red-500';
  };

  return (
    <div className="max-w-md space-y-4">
      <div className="relative">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 ${
            getStrengthColor()
          } ${isLoading ? 'pr-10' : ''}`}
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-3.5 animate-spin">
            <div className="w-5 h-5 border-2 border-gray-400 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {strength && (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i < strength.score ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          
          <ul className="list-disc pl-5 text-sm text-gray-600">
            {strength.feedback.map((msg, i) => (
              <li key={i} className={msg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}>
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
