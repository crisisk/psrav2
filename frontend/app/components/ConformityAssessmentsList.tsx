// Component to display and manage conformity assessments
'use client';

import { useEffect, useState } from 'react';
import { ConformityAssessment, ResultsResponse, StatusColors } from '@/lib/types/conformity';

interface AssessmentListProps {
  initialData?: ConformityAssessment[];
}

export default function ConformityAssessmentsList({ initialData }: AssessmentListProps) {
  const [assessments, setAssessments] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialData) {
      fetchAssessments();
    }
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/conformity-assessments');
      if (!response.ok) throw new Error('Failed to fetch');
      const { data }: ResultsResponse = await response.json();
      setAssessments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading assessments...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Conformity Assessments</h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {assessments.map((assessment) => (
            <div key={assessment.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-gray-900">{assessment.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {assessment.organization} - {assessment.standard}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${StatusColors[assessment.status]}`}
                >
                  {assessment.status}
                </span>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Assessed on: {new Date(assessment.assessmentDate).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
