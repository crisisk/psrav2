'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  query: z.string().min(1, 'Required').max(1000),
  context: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AssessmentGenerator() {
  const [assessment, setAssessment] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      setError('');
      setAssessment('');

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch assessment');
      }

      const result = await response.json();
      setAssessment(result.assessment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Query
          </label>
          <textarea
            {...register('query')}
            className={`w-full p-2 border rounded-md ${errors.query ? 'border-red-500' : 'border-gray-300'}`}
            rows={3}
            disabled={isLoading}
          />
          {errors.query && (
            <p className="text-red-500 text-sm mt-1">{errors.query.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Context (optional)
          </label>
          <textarea
            {...register('context')}
            className="w-full p-2 border border-gray-300 rounded-md"
            rows={2}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 text-white rounded-md ${isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? 'Generating...' : 'Generate Assessment'}
        </button>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            Error: {error}
          </div>
        )}

        {assessment && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-lg font-semibold mb-2">Assessment Result:</h3>
            <p className="whitespace-pre-wrap">{assessment}</p>
          </div>
        )}
      </form>
    </div>
  );
}
