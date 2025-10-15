'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { CtaMapping, ErrorResponse } from '@/types/cta';

export function CtaMappingManager() {
  const [ctas, setCtas] = useState<CtaMapping[]>([]);
  const [error, setError] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    actionType: '',
    configuration: {}
  });

  useEffect(() => {
    fetchCtas();
  }, []);

  const fetchCtas = async () => {
    try {
      const response = await axios.get<CtaMapping[]>('/api/cta-mappings');
      setCtas(response.data);
    } catch (err) {
      setError('Failed to load CTA mappings');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post<CtaMapping>('/api/cta-mappings', formData);
      setCtas([...ctas, response.data]);
      setFormData({ name: '', actionType: '', configuration: {} });
    } catch (err) {
      setError('Failed to create CTA mapping');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">CTA Mapping Manager</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium mb-2">
              Name
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="mt-1 block w-full rounded border-gray-300 p-2"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Action Type
              <select
                value={formData.actionType}
                onChange={(e) => setFormData({...formData, actionType: e.target.value})}
                className="mt-1 block w-full rounded border-gray-300 p-2"
                required
              >
                <option value="">Select an action</option>
                <option value="email">Email</option>
                <option value="api">API Call</option>
                <option value="redirect">Redirect</option>
              </select>
            </label>
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Generate CTA
        </button>
      </form>

      <div className="space-y-4">
        {ctas.map((cta) => (
          <div
            key={cta.id}
            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-lg">{cta.name}</h3>
            <p className="text-sm text-gray-600">Type: {cta.actionType}</p>
            <time className="text-xs text-gray-500">
              Created: {new Date(cta.createdAt).toLocaleDateString()}
            </time>
          </div>
        ))}
      </div>
    </div>
  );
}
