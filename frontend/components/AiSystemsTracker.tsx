"use client";

import { useEffect, useState } from 'react';
import { type AiSystem, type CreateAiSystemDto } from '@/lib/types/ai-system';

export default function AiSystemsTracker() {
  const [systems, setSystems] = useState<AiSystem[]>([]);
  const [formData, setFormData] = useState<CreateAiSystemDto>({
    name: '',
    provider: '',
    description: '',
  });

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    try {
      const response = await fetch('/api/ai-systems');
      const data = await response.json();
      setSystems(data);
    } catch (error) {
      console.error('Failed to fetch systems:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/ai-systems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create system');
      
      await fetchSystems();
      setFormData({ name: '', provider: '', description: '' });
    } catch (error) {
      console.error('Submission error:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI Systems Tracker</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              System Name
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Provider
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add AI System
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compliance Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {systems.map((system) => (
              <tr key={system.id}>
                <td className="px-6 py-4 whitespace-nowrap">{system.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{system.provider}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {system.complianceStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    {system.riskLevel}
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