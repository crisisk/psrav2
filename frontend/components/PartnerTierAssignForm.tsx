'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AssignTierSchema } from '@/lib/validations/partner-tier';

type FormData = z.infer<typeof AssignTierSchema>;

export function PartnerTierAssignForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(AssignTierSchema)
  });

  const onSubmit = async (data: FormData) => {
    try {
      const response = await fetch('/api/partner-tier/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Assignment failed');
      }

      const result = await response.json();
      alert(`Tier assigned: ${result.assignedTier}`);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error assigning tier. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
      <div>
        <Label htmlFor="partnerId">Partner ID</Label>
        <Input
          id="partnerId"
          type="text"
          {...register('partnerId')}
          className="mt-1 block w-full"
        />
        {errors.partnerId && (
          <p className="text-sm text-red-500 mt-1">{errors.partnerId.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="assessmentScore">Assessment Score</Label>
        <Input
          id="assessmentScore"
          type="number"
          min="0"
          max="100"
          {...register('assessmentScore', { valueAsNumber: true })}
          className="mt-1 block w-full"
        />
        {errors.assessmentScore && (
          <p className="text-sm text-red-500 mt-1">
            {errors.assessmentScore.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isSubmitting ? 'Assigning...' : 'Assign Tier'}
      </Button>
    </form>
  );
}
