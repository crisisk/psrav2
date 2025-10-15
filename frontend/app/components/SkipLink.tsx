'use client';

import { useRouter } from 'next/navigation';

export default function SkipLink() {
  const router = useRouter();

  const handleSkip = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/skip-now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Skip request failed');

      router.push('/dashboard');
    } catch (error) {
      console.error('Skip error:', error);
      alert('Failed to skip. Please try again.');
    }
  };

  return (
    <button
      onClick={handleSkip}
      className="text-blue-600 hover:text-blue-800 underline text-sm bg-transparent border-none p-0 cursor-pointer"
      role="link"
    >
      Skip for now
    </button>
  );
}