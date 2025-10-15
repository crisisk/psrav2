import React from 'react';

type Partner = {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
};

export default async function PartnersList() {
  let data: Partner[] | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/partners`, {
      method: 'GET',
      next: { tags: ['partners'] },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to fetch partners');
    }

    data = result.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load partners';
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Audit Log - Partners</h1>

        {error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            Error: {error}
          </div>
        ) : data ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created At</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{partner.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(partner.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          partner.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {partner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
            Loading partners...
          </div>
        )}
      </div>
    </div>
  );
}
