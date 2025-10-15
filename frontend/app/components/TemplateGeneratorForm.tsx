'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

type FormData = {
  productName: string;
  provider: string;
  riskCategory: string;
  assessmentDate: string;
};

export function TemplateGeneratorForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to generate template');
      }

      // Create blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `conformity-assessment-${data.productName}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to generate document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Generate EU AI Act Compliance Template</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Product Name
            <input
              {...register('productName', { required: true })}
              className={`mt-1 block w-full rounded-md ${errors.productName ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            />
          </label>
          {errors.productName && <p className="text-red-500 text-sm mt-1">This field is required</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Provider
            <input
              {...register('provider', { required: true })}
              className={`mt-1 block w-full rounded-md ${errors.provider ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            />
          </label>
          {errors.provider && <p className="text-red-500 text-sm mt-1">This field is required</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Risk Category
            <select
              {...register('riskCategory', { required: true })}
              className={`mt-1 block w-full rounded-md ${errors.riskCategory ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            >
              <option value="">Select category</option>
              <option value="Unacceptable">Unacceptable</option>
              <option value="High">High</option>
              <option value="Limited">Limited</option>
              <option value="Minimal">Minimal</option>
            </select>
          </label>
          {errors.riskCategory && <p className="text-red-500 text-sm mt-1">This field is required</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Date
            <input
              type="date"
              {...register('assessmentDate', { required: true })}
              className={`mt-1 block w-full rounded-md ${errors.assessmentDate ? 'border-red-500' : 'border-gray-300'} shadow-sm focus:border-blue-500 focus:ring-blue-500`}
            />
          </label>
          {errors.assessmentDate && <p className="text-red-500 text-sm mt-1">This field is required</p>}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
        >
          {loading ? 'Generating...' : 'Download Word Template'}
        </button>
      </form>
    </div>
  );
}
