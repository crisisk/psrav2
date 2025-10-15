import type { CommissionDispute } from '@/types';

export default async function CommissionDisputesTable() {
  let disputes: CommissionDispute[] | { error: string };
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/commission-disputes`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch disputes');
    }

    disputes = await response.json();
  } catch (error) {
    disputes = { error: 'Failed to load commission disputes' };
  }

  return (
    <div className="rounded-lg border border-gray-200 shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Commission Disputes</h2>
      
      {'error' in disputes ? (
        <div className="text-red-500 p-4 bg-red-50 rounded-lg">
          {disputes.error}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-2 font-medium">User</th>
                <th className="px-4 py-2 font-medium">Commission ID</th>
                <th className="px-4 py-2 font-medium">Reason</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute.id} className="border-t border-gray-100">
                  <td className="px-4 py-3">{dispute.userId}</td>
                  <td className="px-4 py-3">{dispute.commissionId}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{dispute.reason}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        dispute.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {dispute.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
