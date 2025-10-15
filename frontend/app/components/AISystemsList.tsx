'use client';

import { useEffect, useState } from 'react';

// Type definitions matching API response
interface AISystem {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

type AISystemsListProps = {
  tenantId: string;
};

export default function AISystemsList({ tenantId }: AISystemsListProps) {
  const [systems, setSystems] = useState<AISystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        const response = await fetch(
          `/api/ai-systems?tenant_id=${tenantId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setSystems(data.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load systems');
      } finally {
        setLoading(false);
      }
    };

    fetchSystems();
  }, [tenantId]);

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading AI systems...
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
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold">AI Systems</h2>
      
      {systems.length === 0 ? (
        <div className="text-gray-500">No AI systems found</div>
      ) : (
        <div className="grid gap-4">
          {systems.map((system) => (
            <div
              key={system.id}
              className="rounded border p-4 hover:bg-gray-50"
            >
              <h3 className="font-medium">{system.name}</h3>
              <p className="text-sm text-gray-600">{system.description}</p>
              <div className="mt-2 text-xs text-gray-400">
                Last updated: {new Date(system.updated_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
