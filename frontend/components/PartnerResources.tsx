'use client';
import { useEffect, useState } from 'react';

type ResourceType = 'GUIDE' | 'TOOL' | 'TEMPLATE' | 'OTHER';

type PartnerResource = {
  id: string;
  title: string;
  description?: string;
  url: string;
  type: ResourceType;
  createdAt: Date;
};

export default function PartnerResources() {
  const [resources, setResources] = useState<PartnerResource[]>([]);
  const [formState, setFormState] = useState<Partial<PartnerResource>>({});
  const [error, setError] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/partner-resources');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setResources(data);
    } catch (err) {
      setError('Failed to load resources');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? '/api/partner-resources' : '/api/partner-resources';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...formState, id: editingId } : formState)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Operation failed');
      }

      await fetchResources();
      setFormState({});
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/partner-resources?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');
      await fetchResources();
    } catch (err) {
      setError('Failed to delete resource');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Partner Resources</h1>

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Title"
            className="p-2 border rounded"
            value={formState.title || ''}
            onChange={(e) => setFormState({ ...formState, title: e.target.value })}
            required
          />
          <input
            type="url"
            placeholder="URL"
            className="p-2 border rounded"
            value={formState.url || ''}
            onChange={(e) => setFormState({ ...formState, url: e.target.value })}
            required
          />
          <select
            className="p-2 border rounded"
            value={formState.type || ''}
            onChange={(e) => setFormState({ ...formState, type: e.target.value as ResourceType })}
            required
          >
            <option value="">Select Type</option>
            <option value="GUIDE">Guide</option>
            <option value="TOOL">Tool</option>
            <option value="TEMPLATE">Template</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            type="text"
            placeholder="Description"
            className="p-2 border rounded"
            value={formState.description || ''}
            onChange={(e) => setFormState({ ...formState, description: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {editingId ? 'Update Resource' : 'Add Resource'}
        </button>
      </form>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">URL</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((resource) => (
              <tr key={resource.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{resource.title}</td>
                <td className="px-4 py-2 capitalize">{resource.type.toLowerCase()}</td>
                <td className="px-4 py-2">
                  <a
                    href={resource.url}
                    target="_blank"
                    className="text-blue-600 hover:underline"
                  >
                    Open
                  </a>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => {
                      setFormState(resource);
                      setEditingId(resource.id);
                    }}
                    className="text-green-600 hover:text-green-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
