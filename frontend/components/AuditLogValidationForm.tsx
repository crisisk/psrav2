'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AuditLogSchema } from '@/lib/validations/audit-log';

type FormData = z.infer<typeof AuditLogSchema>;

export default function AuditLogValidationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(AuditLogSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/audit-logs/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          // Set server-side validation errors
          Object.entries(result.details).forEach(([field, messages]) => {
            setError(field as keyof FormData, {
              type: 'server',
              message: (messages as string[]).join(', '),
            });
          });
        }
        throw new Error(result.error || 'Validation failed');
      }

      // Handle successful validation
      alert(`Validation successful: ${result.message}`);
    } catch (error) {
      if (error instanceof Error) {
        alert(`Error: ${error.message}`);
      } else {
        alert('An unexpected error occurred');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          User ID
        </label>
        <input
          {...register('userId')}
          className={`w-full px-3 py-2 border ${errors.userId ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
          type="text"
        />
        {errors.userId && (
          <p className="text-red-500 text-xs mt-1">{errors.userId.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Action
        </label>
        <select
          {...register('action')}
          className={`w-full px-3 py-2 border ${errors.action ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          <option value="">Select action</option>
          {['CREATE', 'READ', 'UPDATE', 'DELETE'].map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
        {errors.action && (
          <p className="text-red-500 text-xs mt-1">{errors.action.message}</p>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2">
          Entity Type
        </label>
        <input
          {...register('entityType')}
          className={`w-full px-3 py-2 border ${errors.entityType ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
          type="text"
        />
        {errors.entityType && (
          <p className="text-red-500 text-xs mt-1">{errors.entityType.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Validating...' : 'Validate Entry'}
      </button>
    </form>
  );
}
