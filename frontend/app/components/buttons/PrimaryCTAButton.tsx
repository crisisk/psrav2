import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type PrimaryCTAButtonProps = {
  children: React.ReactNode;
  saveEndpoint: string;
  redirectPath?: string;
};

export function PrimaryCTAButton({ children, saveEndpoint, redirectPath }: PrimaryCTAButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(saveEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'save' }),
      });

      if (!response.ok) {
        throw new Error(`Save failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && redirectPath) {
        router.push(redirectPath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  }, [saveEndpoint, redirectPath, router]);

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`
          px-6 py-3 rounded-md font-medium transition-colors
          ${isLoading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'}
        `}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          children
        )}
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
