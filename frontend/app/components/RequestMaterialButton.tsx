'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from '@/lib/zod';
import { zodResolver } from '@hookform/resolvers/zod';

// Reuse validation schema from API route
const formSchema = z.object({
  materialName: z.string().min(3, 'Material name must be at least 3 characters'),
  quantity: z.number().int().positive(),
  urgency: z.enum(['low', 'medium', 'high']),
  additionalNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function RequestMaterialButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/requests/custom-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      // Reset form on success
      reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg
                   transition-colors duration-200 transform hover:scale-105"
      >
        Request Custom Material
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Custom Material Request</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Material Name
                  <input
                    {...register('materialName')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                             focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </label>
                {errors.materialName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.materialName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Quantity
                  <input
                    type="number"
                    {...register('quantity', { valueAsNumber: true })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                             focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </label>
                {errors.quantity && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Urgency
                  <select
                    {...register('urgency')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                             focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional Notes
                  <textarea
                    {...register('additionalNotes')}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm
                             focus:border-blue-500 focus:ring-blue-500"
                    rows={3}
                    disabled={isLoading}
                  />
                </label>
              </div>

              {submitError && (
                <p className="text-red-500 text-sm">{submitError}</p>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    reset();
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg
                           hover:bg-blue-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
