'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AssessmentSchema, type Assessment } from '@/lib/validations/assessment';
import { Button } from '@/components/ui/Button';

export function AssessmentForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Assessment>({
    resolver: zodResolver(AssessmentSchema),
  });

  const onSubmit = async (data: Assessment) => {
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Submission failed');
      }

      alert('Assessment submitted successfully!');
    } catch (error) {
      alert('Error submitting assessment');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-2xl">
      <div>
        <label className="block text-sm font-medium mb-1">Assessment Name</label>
        <input
          {...register('name')}
          className="w-full p-2 border rounded"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          {...register('status')}
          className="w-full p-2 border rounded"
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">
        Submit Assessment
      </Button>
    </form>
  );
}
