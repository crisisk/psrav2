'use client';

import { useForm } from 'react-hook-form';
import { z } from '@/lib/zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';

const formSchema = z.object({
  title: z.string().min(3).max(50),
  description: z.string().min(10).max(1000),
  auditLogEntryId: z.string().uuid(),
});

type FormValues = z.infer<typeof formSchema>;

export function CreateDisputeForm({
  auditLogEntryId,
}: {
  auditLogEntryId: string;
}) {
  const [submissionError, setSubmissionError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      auditLogEntryId,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      setSubmissionError('');

      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dispute');
      }

      window.location.href = `/disputes?success=true`;
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionError(
        error instanceof Error ? error.message : 'Failed to create dispute'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input type="hidden" {...register('auditLogEntryId')} />

      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Title
        </label>
        <input
          id="title"
          {...register('title')}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          className="mt-1 block w-full rounded-md border border-gray-300 p-2"
          rows={4}
          disabled={isSubmitting}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {submissionError && (
        <p className="text-sm text-red-600">{submissionError}</p>
      )}

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Create Dispute'}
      </button>
    </form>
  );
}
