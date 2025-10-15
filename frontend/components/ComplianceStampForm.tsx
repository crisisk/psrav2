'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ComplianceStamp } from '@/types/index';

const stampSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'),
});

type FormValues = z.infer<typeof stampSchema>;

interface ComplianceStampFormProps {
  initialData?: ComplianceStamp;
  onSubmit: (data: FormValues) => Promise<void>;
}

export function ComplianceStampForm({ initialData, onSubmit }: ComplianceStampFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({
    resolver: zodResolver(stampSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      color: '#3b82f6',
    },
  });

  const handleFormSubmit = async (data: FormValues) => {
    try {
      setSubmitting(true);
      setError(null);
      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save stamp');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4'>
      {error && <div className='text-red-500 p-2 bg-red-50 rounded'>{error}</div>}

      <div>
        <label className='block text-sm font-medium text-gray-700'>Name</label>
        <input
          {...register('name')}
          className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
        />
        {errors.name && (
          <span className='text-red-500 text-sm'>{errors.name.message}</span>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700'>Description</label>
        <textarea
          {...register('description')}
          className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
        />
      </div>

      <div>
        <label className='block text-sm font-medium text-gray-700'>Color</label>
        <input
          type='color'
          {...register('color')}
          className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
          onChange={(e) => setValue('color', e.target.value)}
        />
        {errors.color && (
          <span className='text-red-500 text-sm'>{errors.color.message}</span>
        )}
      </div>

      <button
        type='submit'
        disabled={submitting}
        className='inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50'
      >
        {submitting ? 'Saving...' : 'Save Stamp'}
      </button>
    </form>
  );
}
