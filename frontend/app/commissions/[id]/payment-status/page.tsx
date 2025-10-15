'use client';

import { useParams } from 'next/navigation';

export default function PaymentStatusPage() {
  const params = useParams();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Payment-status Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Viewing payment-status: {JSON.stringify(params)}</p>
      </div>
    </div>
  );
}
