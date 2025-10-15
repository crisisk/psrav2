'use client';

import { useEffect, useState } from 'react';

type ComplianceEntry = {
  id: string;
  reference: string;
  regulation: string;
  status: 'compliant' | 'non-compliant' | 'in-review';
  dueDate: string;
  lastUpdated: string;
};

export default function ComplianceTracker() {
  const [entries, setEntries] = useState<ComplianceEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Omit<ComplianceEntry, 'id' | 'lastUpdated'>>({
    reference: '',
    regulation: '',
    status: 'in-review',
    dueDate: ''
  });
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/compliance');
        if (!response.ok) throw new Error('Failed to fetch');
        const { data } = await response.json();
        setEntries(data);
      } catch (err) {
        setError('Failed to load compliance data');
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry)
      });

      if (!response.ok) throw new Error('Submission failed');

      const result = await response.json();
      setEntries([...entries, result]);
      setNewEntry({ reference: '', regulation: '', status: 'in-review', dueDate: '' });
    } catch (err) {
      setError('Failed to submit new entry');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CBAM Compliance Tracker</h1>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Reference"
            className="p-2 border rounded"
            value={newEntry.reference}
            onChange={(e) => setNewEntry({...newEntry, reference: e.target.value})}
          />
          <input
            type="text"
            placeholder="Regulation"
            className="p-2 border rounded"
            value={newEntry.regulation}
            onChange={(e) => setNewEntry({...newEntry, regulation: e.target.value})}
          />
          <select
            className="p-2 border rounded"
            value={newEntry.status}
            onChange={(e) => setNewEntry({...newEntry, status: e.target.value as any})}
          >
            <option value="in-review">In Review</option>
            <option value="compliant">Compliant</option>
            <option value="non-compliant">Non-compliant</option>
          </select>
          <input
            type="date"
            className="p-2 border rounded"
            value={newEntry.dueDate}
            onChange={(e) => setNewEntry({...newEntry, dueDate: e.target.value})}
          />
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Compliance Entry
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulation</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 whitespace-nowrap">{entry.reference}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.regulation}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(entry.status)}`}>
                    {entry.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.dueDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">{entry.lastUpdated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
