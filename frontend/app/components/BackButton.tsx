'use client';

import { useRouter } from 'next/navigation';

export const BackButton = () => {
  const router = useRouter();

  const handleNavigation = async () => {
    try {
      // Track back action before navigating
      await fetch('/api/back', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromPage: window.location.pathname
        }),
      });
    } catch (error) {
      console.error('Failed to track back action:', error);
    } finally {
      router.back();
    }
  };

  return (
    <button
      onClick={handleNavigation}
      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      aria-label="Navigate back"
    >
      <svg
        className="w-5 h-5 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Back
    </button>
  );
};
