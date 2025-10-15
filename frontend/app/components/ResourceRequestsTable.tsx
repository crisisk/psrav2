import { ResourceRequest } from '@/lib/types';

export default async function ResourceRequestsTable() {
  let requests: ResourceRequest[] = [];
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resource-requests`, {
      next: { tags: ['resource-requests'] },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch resource requests');
    }
    
    requests = await response.json();
  } catch (error) {
    console.error('Failed to load resource requests:', error);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading resource requests. Please try again later.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested At</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requests.map((request) => (
            <tr key={request.id}>
              <td className="px-6 py-4 text-sm text-gray-900">{request.userId}</td>
              <td className="px-6 py-4 text-sm text-gray-900">{request.resourceType}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  request.status === 'approved' ? 'bg-green-100 text-green-800' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {request.status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(request.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
