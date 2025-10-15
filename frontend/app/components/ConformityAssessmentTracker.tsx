'use client';

import { useEffect, useState } from 'react';

type ConformityAssessment = {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  assessmentDate: Date;
};

export default function ConformityAssessmentTracker() {
  const [assessments, setAssessments] = useState<ConformityAssessment[]>([]);
  const [formState, setFormState] = useState<Omit<ConformityAssessment, 'id'>>({
    name: '',
    status: 'pending',
    assessmentDate: new Date()
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await fetch('/api/conformity-assessments');
        if (!response.ok) throw new Error('Failed to fetch');
        const { data } = await response.json();
        setAssessments(data);
      } catch (err) {
        setError('Failed to load assessments');
      }
    };
    fetchAssessments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch('/api/conformity-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.formErrors?.join(', ') || 'Submission failed');
      }

      const { data } = await response.json();
      setAssessments(prev => [...prev, data]);
      setFormState({ name: '', status: 'pending', assessmentDate: new Date() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit assessment');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Conformity Assessment Tracker</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Assessment Name
              <input
                type="text"
                value={formState.name}
                onChange={e => setFormState({ ...formState, name: e.target.value })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </label>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Status
              <select
                value={formState.status}
                onChange={e => setFormState({ ...formState, status: e.target.value as any })}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Assessment Date
              <input
                type="date"
                value={formState.assessmentDate.toISOString().split('T')[0]}
                onChange={e => setFormState({ ...formState, assessmentDate: new Date(e.target.value) })}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Add Assessment
        </button>
      </form>

      <div className="bg-white shadow-md rounded">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map(assessment => (
              <tr key={assessment.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{assessment.name}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span className={`px-2 py-1 rounded-full ${{
                    'pending': 'bg-yellow-100 text-yellow-800',
                    'approved': 'bg-green-100 text-green-800',
                    'rejected': 'bg-red-100 text-red-800'
                  }[assessment.status]}`}>
                    {assessment.status}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  {assessment.assessmentDate.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
