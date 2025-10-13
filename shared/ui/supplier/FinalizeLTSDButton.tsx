import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/shared/lib/telemetry';

enum ChainStatus {
  INCOMPLETE = 'INCOMPLETE',
  COMPLETE = 'COMPLETE',
  PENDING = 'PENDING'
}

interface FinalizeLTSDButtonProps {
  ltsdId: string;
  chainStatus?: ChainStatus | string;
  className?: string;
  onSuccess?: () => void;
}

export const FinalizeLTSDButton = ({
  ltsdId,
  chainStatus = ChainStatus.PENDING,
  className = '',
  onSuccess
}: FinalizeLTSDButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isDisabled = chainStatus !== ChainStatus.COMPLETE && chainStatus !== 'COMPLETE';

  const handleFinalize = async () => {
    try {
      setIsLoading(true);
      trackEvent('ltsd_finalize_start', { ltsdId });

      const response = await fetch(`/api/ltsd/${ltsdId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to finalize LTSD');
      }

      toast.success('LTSD finalized successfully');
      trackEvent('ltsd_finalize_success', { ltsdId });
      if (onSuccess) {
        onSuccess();
      }
      router.push('/ltsd/list');
    } catch (error) {
      console.error('Failed to finalize LTSD:', error);
      toast.error('Failed to finalize LTSD. Please try again.');
      trackEvent('ltsd_finalize_error', { ltsdId, error: String(error) });
    } finally {
      setIsLoading(false);
      setIsModalOpen(false);
    }
  };

  return (
    <>
      {/* Button with tooltip */}
      <div className="relative inline-block group">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isDisabled || isLoading}
          className={`flex items-center gap-2 px-4 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium ${className}`}
          title={isDisabled ? 'All chain steps must be completed before finalizing' : ''}
        >
          <CheckCircle className="h-5 w-5" />
          {isLoading ? 'Finalizing...' : 'Finalize LTSD'}
        </button>

        {/* Tooltip for disabled state */}
        {isDisabled && (
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
            All chain steps must be completed before finalizing
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-bg-surface rounded-lg p-6 w-full max-w-md shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-orange-500" />
                Finalize LTSD
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to finalize this LTSD? This action cannot be undone.
              </p>
            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <CheckCircle className="h-5 w-5" />
                {isLoading ? 'Finalizing...' : 'Finalize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinalizeLTSDButton;
