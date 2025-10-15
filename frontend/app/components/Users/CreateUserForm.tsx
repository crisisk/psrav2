'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateUserSchema } from '@/lib/validations';
import type { CreateUserInput } from '@/lib/validations';

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateUserInput>({
    resolver: zodResolver(CreateUserSchema),
  });

  const onSubmit = async (data: CreateUserInput) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Form submission error:', error);
      alert(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Email
          <input
            {...register('email')}
            type="email"
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            disabled={isSubmitting}
          />
        </label>
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Name
          <input
            {...register('name')}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            disabled={isSubmitting}
          />
        </label>
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Role
          <select
            {...register('role')}
            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
            disabled={isSubmitting}
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
            <option value="AUDITOR">Auditor</option>
          </select>
        </label>
        {errors.role && (
          <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
