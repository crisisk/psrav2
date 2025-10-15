'use client';
import { useState, useEffect } from 'react';

type RefreshButtonProps = {
  onRefresh: () => Promise<void>;
};

export const RefreshButton = ({ onRefresh }: RefreshButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      await onRefresh();
    } finally {
      // Ensure spinning animation completes even if error occurs
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="relative inline-flex items-center justify-center rounded-full p-2
        text-gray-600 hover:bg-gray-100 hover:text-gray-900
        focus:outline-none focus:ring-2 focus:ring-gray-300
        transition-all duration-200 ease-in-out"
      aria-label="Refresh audit logs"
    >
      <svg
        className={`h-6 w-6 ${isLoading ? 'animate-spin' : ''}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );
};
