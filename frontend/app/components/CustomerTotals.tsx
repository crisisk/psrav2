import { CustomerTotal } from '@/app/api/audit-logs/customer-totals/route';

export default async function CustomerTotals() {
  let customerTotals: CustomerTotal[] = [];
  let error: string | null = null;

  try {
    const response = await fetch(
      '/api/audit-logs/customer-totals',
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    customerTotals = data.data;

  } catch (err) {
    console.error('[CustomerTotals] Error:', err);
    error = 'Failed to load customer totals. Please try again later.';
  }

  if (error) {
    return (
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
        {error}
      </div>
    );
  }

  if (customerTotals.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        No audit data available
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Amount
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customerTotals.map((total) => (
            <tr key={total.customerId}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {total.customerId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {total.customerName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${total.totalAmount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
