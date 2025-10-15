'use client';

import { useEffect, useState } from 'react';
import { Assessment } from '@/lib/assessments';

interface AssessmentFilterProps {
  initialAssessments: Assessment[];
}

export const statusOptions = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'CHURNED', label: 'Churned' },
] as const;

export function AssessmentFilter({ initialAssessments }: AssessmentFilterProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/assessments?status=${selectedStatus}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch assessments');
        }

        const data = await response.json();
        setAssessments(data);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load assessments. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedStatus !== 'ALL') {
      fetchAssessments();
    } else {
      setAssessments(initialAssessments);
    }
  }, [selectedStatus, initialAssessments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-lg border px-4 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {isLoading && (
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {assessments.map((assessment) => (
          <div
            key={assessment.id}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-lg text-gray-800">
              {assessment.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Status: {assessment.status}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Created: {new Date(assessment.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
