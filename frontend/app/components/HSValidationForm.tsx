'use client';

import { useState } from 'react';

export default function HSValidationForm() {
  const [hsCode, setHsCode] = useState('');
  const [weight, setWeight] = useState('');
  const [errors, setErrors] = useState<{
    hsCode?: string;
    weight?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    try {
      const response = await fetch('/api/validate-hs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hsCode,
          weight: parseFloat(weight)
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || {});
      } else {
        setSuccess(true);
        // Reset form on successful validation
        setHsCode('');
        setWeight('');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      setErrors({ hsCode: 'Network error. Please try again.' });
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="hsCode" className="block text-sm font-medium text-gray-700">
            HS Code
          </label>
          <input
            id="hsCode"
            type="text"
            value={hsCode}
            onChange={(e) => setHsCode(e.target.value)}
            className={`mt-1 block w-full rounded-md border ${
              errors.hsCode ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
            placeholder="Enter 6-digit HS code"
          />
          {errors.hsCode && (
            <p className="mt-1 text-sm text-red-600">{errors.hsCode}</p>
          )}
        </div>

        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
            Weight (kg)
          </label>
          <input
            id="weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className={`mt-1 block w-full rounded-md border ${
              errors.weight ? 'border-red-500' : 'border-gray-300'
            } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm`}
            placeholder="Enter weight in kilograms"
            step="0.01"
          />
          {errors.weight && (
            <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Validate
        </button>

        {success && (
          <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md">
            Validation successful!
          </div>
        )}
      </form>
    </div>
  );
}
