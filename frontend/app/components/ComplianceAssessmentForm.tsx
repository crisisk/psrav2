'use client';

import { useState, useTransition } from 'react';
import { z } from '@/lib/zod';

type ComplianceResult = {
  compliant: boolean;
  requirements: {
    documentation: boolean;
    riskAssessment: boolean;
    humanOversight: boolean;
  };
  nextSteps: string[];
  lastUpdated: string;
};

export function ComplianceAssessmentForm() {
  const [result, setResult] = useState<ComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    
    const rawData = {
      systemDescription: formData.get('description')?.toString() || '',
      intendedUse: formData.get('use')?.toString() || '',
      dataSources: formData.getAll('dataSources'),
      riskLevel: formData.get('riskLevel')?.toString(),
      category: formData.get('category')?.toString()
    };

    try {
      startTransition(async () => {
        const response = await fetch('/api/compliance-assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(rawData)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Assessment failed');
        }

        const data = await response.json();
        setResult(data);
      });
    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Failed to perform assessment');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <form action={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            System Description
            <textarea
              name="description"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={4}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Risk Level
              <select
                name="riskLevel"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="I">Level I</option>
                <option value="II">Level II</option>
                <option value="III">Level III</option>
                <option value="IV">Level IV</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Category
              <select
                name="category"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="Prohibited">Prohibited</option>
                <option value="HighRisk">High Risk</option>
                <option value="LimitedRisk">Limited Risk</option>
                <option value="MinimalRisk">Minimal Risk</option>
              </select>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isPending ? 'Assessing...' : 'Check Compliance'}
        </button>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error}
          </div>
        )}
      </form>

      {result && (
        <div className="mt-8 p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {result.compliant ? '✅ Compliant' : '❌ Needs Improvement'}
          </h3>
          
          <div className="space-y-3">
            <p><strong>Last Updated:</strong> {new Date(result.lastUpdated).toLocaleString()}</p>
            
            <div className="mt-4">
              <h4 className="font-medium mb-2">Requirements Met:</h4>
              <ul className="list-disc pl-6 space-y-2">
                <li className={result.requirements.documentation ? 'text-green-600' : 'text-red-600'}>
                  Documentation: {result.requirements.documentation ? 'Complete' : 'Incomplete'}
                </li>
                <li className={result.requirements.riskAssessment ? 'text-green-600' : 'text-red-600'}>
                  Risk Assessment: {result.requirements.riskAssessment ? 'Completed' : 'Required'}
                </li>
                <li className={result.requirements.humanOversight ? 'text-green-600' : 'text-red-600'}>
                  Human Oversight: {result.requirements.humanOversight ? 'Implemented' : 'Required'}
                </li>
              </ul>
            </div>

            <div className="mt-4">
              <h4 className="font-medium mb-2">Next Steps:</h4>
              <ul className="list-disc pl-6 space-y-2">
                {result.nextSteps.map((step, index) => (
                  <li key={index} className="text-gray-700">{step}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
