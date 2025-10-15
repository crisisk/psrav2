'use client';

import { useEffect, useState } from 'react';

export interface ModelVersion {
  id: string;
  name: string;
  version: string;
}

export default function ModelDropdown() {
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/model-versions');
        if (!response.ok) throw new Error('Failed to fetch models');
        
        const data = await response.json();
        setModels(data.data);
        
        // Auto-select the first model if available
        if (data.data.length > 0) {
          setSelectedModel(data.data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load models');
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  if (error) {
    return <div className="text-red-500 text-sm p-2">Error: {error}</div>;
  }

  return (
    <div className="w-full max-w-xs">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700"
        disabled={loading}
      >
        {loading ? (
          <option>Loading models...</option>
        ) : (
          models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} {model.version}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
