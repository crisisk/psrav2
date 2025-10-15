'use client';

import { useState } from 'react';

// Client-side email validation regex (matches server-side pattern)
const EMAIL_REGEX = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const EmailValidationForm = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation first
    if (!EMAIL_REGEX.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/validate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Validation failed');
      } else {
        setError('');
        // Proceed with valid email...
        console.log('Email validated successfully:', email);
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Failed to validate email');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(''); // Clear error on input change
          }}
          className={`mt-1 block w-full rounded-md p-2 border ${
            error ? 'border-red-500' : 'border-gray-300'
          } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Enter your email"
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-sm mt-1">{error}</div>
      )}

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
      >
        Validate Email
      </button>
    </form>
  );
};
