import Link from 'next/link';

type Customer = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

export async function CustomersList() {
  let data: Customer[] = [];
  let error = '';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.success) {
      data = result.data;
    } else {
      error = result.error || 'Failed to load customers';
    }
  } catch (err) {
    console.error('[CustomersList]', err);
    error = err instanceof Error ? err.message : 'Failed to fetch customers';
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        <p>Error loading customers: {error}</p>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="p-4 bg-blue-50 text-blue-700 rounded-lg">
        No customers found for your partner account
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((customer) => (
            <tr key={customer.id}>
              <td className="px-6 py-4 whitespace-nowrap">{customer.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{customer.email}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(customer.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/customers/${customer.id}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  View Details
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
