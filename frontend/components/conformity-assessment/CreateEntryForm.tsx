'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';

const createSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.string().min(1, 'Due date is required'),
  responsibleParty: z.string().min(1, 'Responsible party is required'),
});

type FormValues = z.infer<typeof createSchema>;

export function CreateEntryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/conformity-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          dueDate: new Date(data.dueDate).toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create entry');
      }

      // Reset form or redirect here
      window.location.href = '/conformity-assessment';
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          {...register('title')}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          {...register('description')}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        >
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        {errors.status && (
          <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Due Date</label>
        <input
          type="datetime-local"
          {...register('dueDate')}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.dueDate && (
          <p className="text-red-500 text-sm mt-1">{errors.dueDate.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Responsible Party</label>
        <input
          {...register('responsibleParty')}
          className="w-full px-3 py-2 border rounded-md"
          disabled={isSubmitting}
        />
        {errors.responsibleParty && (
          <p className="text-red-500 text-sm mt-1">{errors.responsibleParty.message}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating...' : 'Create New Entry'}
      </Button>
    </form>
  );
}
