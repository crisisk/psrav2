'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CustomerCreateSchema } from '@/lib/validations/customer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormData = z.infer<typeof CustomerCreateSchema>;

export function CustomerCreateForm() {
  const router = useRouter();
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(CustomerCreateSchema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed');
      }

      router.refresh();
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          {...register('name')}
          className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          {...register('email')}
          className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          {...register('phone')}
          className={`w-full p-2 border rounded ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address</label>
        <textarea
          {...register('address')}
          className={`w-full p-2 border rounded ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
          rows={3}
        />
        {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
      </div>

      {submissionError && (
        <p className="text-red-500 text-sm">{submissionError}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating...' : 'Create Customer'}
      </button>
    </form>
  );
}
