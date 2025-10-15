'use client';

import { useState } from 'react';

export default function MicrosoftSignInButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/microsoft');

      if (!response.ok) {
        throw new Error('Failed to initiate Microsoft login');
      }

      const { url } = await response.json();
      window.location.href = url;

    } catch (err) {
      console.error('Microsoft login error:', err);
      setError('Failed to start Microsoft login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#2F2F2F] text-white rounded-md hover:bg-[#1E1E1E] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <span className="animate-pulse">Processing...</span>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="20"
              height="20"
              viewBox="0 0 23 23"
              className="fill-current"
            >
              <path d="M11.673 11.306H22V0h-1.44l-5.144 5.143-3.743-3.742v1.433l2.31 2.31-2.31 2.31V7.97l3.742 3.743-5.184 5.113H11.673zM0 11.306h1.44l5.144-5.143 3.743 3.742V8.473L8.017 6.164l2.31-2.31V0H0v11.306zM8.017 16.836l-5.184 5.113H0V22h11.327v-1.433l3.743-3.743-5.144-5.143H11.673V22H22V11.306h-1.44l-5.113 5.184-3.742-3.743v1.433l2.31 2.31-2.31 2.31v1.433l3.743-3.742L20.56 22H22V11.306H11.673v10.327h1.433l5.143-5.144-3.742-3.743-2.31 2.31z"></path>
            </svg>
            <span>Sign in with Microsoft</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
