'use client';
import { useEffect, useState } from 'react';

export interface Assessment {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  assessmentDate: Date;
  standard: string;
}

export default function ConformityAssessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    standard: '',
    assessmentDate: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/conformity-assessments');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setAssessments(data.data);
    } catch (err) {
      setError('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/conformity-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssessment)
      });

      if (!response.ok) throw new Error('Failed to create');
      await fetchAssessments();
      setNewAssessment({ name: '', standard: '', assessmentDate: '' });
    } catch (err) {
      setError('Failed to create assessment');
    }
  };

  if (loading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Conformity Assessments</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Assessment Name"
            className="p-2 border rounded"
            value={newAssessment.name}
            onChange={e => setNewAssessment({...newAssessment, name: e.target.value})}
          />
          <input
            type="text"
            placeholder="Standard"
            className="p-2 border rounded"
            value={newAssessment.standard}
            onChange={e => setNewAssessment({...newAssessment, standard: e.target.value})}
          />
          <input
            type="date"
            className="p-2 border rounded"
            value={newAssessment.assessmentDate}
            onChange={e => setNewAssessment({...newAssessment, assessmentDate: e.target.value})}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Assessment
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Standard</th>
              <th className="py-3 px-4 text-left">Date</th>
              <th className="py-3 px-4 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="border-t">
                <td className="py-3 px-4">{assessment.name}</td>
                <td className="py-3 px-4">{assessment.standard}</td>
                <td className="py-3 px-4">
                  {new Date(assessment.assessmentDate).toLocaleDateString()}
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-sm ${{
                    pending: 'bg-yellow-100 text-yellow-800',
                    'in-progress': 'bg-blue-100 text-blue-800',
                    completed: 'bg-green-100 text-green-800'
                  }[assessment.status]}`}>
                    {assessment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
