import { type ModelOutput } from '@/app/api/analytics/latest-model-outputs/route';

export default async function AuditModelOutputsTable() {
  let data: ModelOutput[] = [];
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/analytics/latest-model-outputs?limit=10`,
      { next: { tags: ['model-outputs'] } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch model outputs');
    }

    const result = await response.json();
    data = result.data;
  } catch (error) {
    console.error('Failed to load model outputs:', error);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading model outputs. Please try again later.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Output</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((output) => (
            <tr key={output.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">{output.modelName}</td>
              <td className="px-6 py-4 text-sm text-gray-500">{output.userId}</td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {JSON.stringify(output.outputData)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {output.timestamp.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          No model outputs found
        </div>
      )}
    </div>
  );
}
