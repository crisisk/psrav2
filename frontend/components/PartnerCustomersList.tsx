import type { PartnerCustomer } from '@/types/partnerCustomer';

export default async function PartnerCustomersList() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/partner-customers`,
    { next: { revalidate: 60 } }
  );

  if (!response.ok) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        Error loading partner customers: {response.statusText}
      </div>
    );
  }

  const partnerCustomers: PartnerCustomer[] = await response.json();

  if (!partnerCustomers.length) {
    return (
      <div className="p-4 bg-blue-50 text-blue-700 rounded">
        No partner customers found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Partner ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer ID</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {partnerCustomers.map((pc) => (
            <tr key={pc.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pc.partner_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pc.customer_id}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(pc.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(pc.updated_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
