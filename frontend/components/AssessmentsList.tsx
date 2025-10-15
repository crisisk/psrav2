'use client';
import { useState, useEffect } from 'react';
import type { Assessment } from '@/types/assessment';

export default function AssessmentsList() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      if (!response.ok) throw new Error('Failed to fetch');
      const { data } = await response.json();
      setAssessments(data);
    } catch (err) {
      setError('Failed to load assessments');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('/api/assessments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error('Delete failed');
      setAssessments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError('Failed to delete assessment');
    }
  };

  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Standard</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {assessments.map((assessment) => (
            <tr key={assessment.id}>
              <td className="px-6 py-4 whitespace-nowrap">{assessment.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{assessment.standard}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                  {assessment.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(assessment.dueDate).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => handleDelete(assessment.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
