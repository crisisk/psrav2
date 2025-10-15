'use client';

import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { RateData } from '@/lib/types';

interface CommissionRateFormProps {
  initialData: RateData;
}

export function CommissionRateForm({ initialData }: CommissionRateFormProps) {
  const [state, formAction] = useFormState(updateRates, { errors: null, success: false });

  async function updateRates(prevState: any, formData: FormData) {
    const rawData = {
      technical: Number(formData.get('technical')),
      implementation: Number(formData.get('implementation')),
      maintenance: Number(formData.get('maintenance')),
    };

    const response = await fetch('/api/commission-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rawData),
    });

    if (!response.ok) {
      const error = await response.json();
      return { errors: error, success: false };
    }

    return { errors: null, success: true };
  }

  return (
    <form action={formAction} className="max-w-md space-y-6">
      <div className="space-y-4">
        {['technical', 'implementation', 'maintenance'].map((category) => (
          <div key={category} className="flex items-center justify-between">
            <label className="text-sm font-medium capitalize">
              {category} Rate (%)
            </label>
            <input
              name={category}
              type="number"
              min="0"
              max="100"
              step="0.1"
              defaultValue={String(initialData[category as keyof RateData])}
              className="ml-4 w-24 rounded-md border px-3 py-2 text-right"
            />
          </div>
        ))}
      </div>

      <SubmitButton />

      {state.errors && (
        <div className="text-red-600 text-sm">
          Invalid input values - rates must be between 0-100
        </div>
      )}

      {state.success && (
        <div className="text-green-600 text-sm">
          Commission rates updated successfully!
        </div>
      )}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
    >
      {pending ? 'Saving...' : 'Update Rates'}
    </button>
  );
}
