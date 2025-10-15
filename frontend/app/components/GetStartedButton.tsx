'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function GetStartedButton() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = async () => {
    startTransition(async () => {
      try {
        const response = await fetch('/api/start-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to start audit');
        }

        const data = await response.json();
        router.push(`/audit/${data.auditId}`);
      } catch (error) {
        console.error('Audit start error:', error);
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      aria-label="Start new audit process"
      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
    >
      {isPending ? 'Starting...' : 'Get Started'}
    </button>
  );
}
