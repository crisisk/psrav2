import React from 'react';

export interface CustomerBreakdown {
  customerId: string;
  count: number;
  customer: {
    id: string;
    name: string;
    email: string;
  } | null;
}

async function fetchCustomerBreakdown() {
  const response = await fetch('/api/conformity/customers');
  
  if (!response.ok) {
    throw new Error('Failed to fetch customer breakdown');
  }
  
  return response.json() as Promise<CustomerBreakdown[]>;
}

export default async function CustomerBreakdown() {
  let data: CustomerBreakdown[];
  
  try {
    data = await fetchCustomerBreakdown();
  } catch (error) {
    console.error('Error loading breakdown:', error);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error loading customer breakdown data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Assessments by Customer</h2>
      <div className="space-y-4">
        {data.map((item) => (
          <div
            key={item.customerId}
            className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg"
          >
            <div>
              <h3 className="font-medium">{item.customer?.name || 'Unknown Customer'}</h3>
              <p className="text-sm text-gray-500">{item.customer?.email}</p>
            </div>
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
              {item.count} assessments
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
