'use client';
import { useEffect, useState } from 'react';

interface Assessment {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  assignedTo: string;
}

export default function AssessmentTracker() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [newAssessment, setNewAssessment] = useState({
    name: '',
    dueDate: '',
    assignedTo: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      if (!response.ok) throw new Error('Failed to fetch assessments');
      const data = await response.json();
      setAssessments(data);
    } catch (err) {
      setError('Failed to load assessments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAssessment)
      });

      if (!response.ok) throw new Error('Failed to create assessment');

      const result = await response.json();
      setAssessments([...assessments, result]);
      setNewAssessment({ name: '', dueDate: '', assignedTo: '' });
      setError(null);
    } catch (err) {
      setError('Error creating assessment');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Conformity Assessment Tracker</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Assessment Name"
            className="p-2 border rounded"
            value={newAssessment.name}
            onChange={e => setNewAssessment({...newAssessment, name: e.target.value})}
            required
          />
          <input
            type="date"
            className="p-2 border rounded"
            value={newAssessment.dueDate}
            onChange={e => setNewAssessment({...newAssessment, dueDate: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Assigned To"
            className="p-2 border rounded"
            value={newAssessment.assignedTo}
            onChange={e => setNewAssessment({...newAssessment, assignedTo: e.target.value})}
            required
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Assessment
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Due Date</th>
              <th className="p-3 text-left">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="border-t">
                <td className="p-3">{assessment.name}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-sm ${{
                    pending: 'bg-yellow-100 text-yellow-800',
                    'in-progress': 'bg-blue-100 text-blue-800',
                    completed: 'bg-green-100 text-green-800'
                  }[assessment.status]}`}>
                    {assessment.status}
                  </span>
                </td>
                <td className="p-3">{new Date(assessment.dueDate).toLocaleDateString()}</td>
                <td className="p-3">{assessment.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
