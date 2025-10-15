import type { CommissionSummary } from '@/app/api/commissions/summary/route';

export default async function CommissionSummary() {
  let data: CommissionSummary | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/commissions/summary`, {
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error('Failed to fetch commission summary');
    }

    data = await response.json();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load commission summary';
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Commission Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Commissions"
          value={data.totalCommissions}
          color="bg-blue-50"
          textColor="text-blue-600"
        />
        <StatCard
          label="Completed"
          value={data.completed}
          color="bg-green-50"
          textColor="text-green-600"
        />
        <StatCard
          label="Pending"
          value={data.pending}
          color="bg-yellow-50"
          textColor="text-yellow-600"
        />
        <StatCard
          label="Avg. Duration (Days)"
          value={data.averageDurationDays}
          color="bg-purple-50"
          textColor="text-purple-600"
          decimal
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
  textColor,
  decimal = false
}: {
  label: string;
  value: number;
  color: string;
  textColor: string;
  decimal?: boolean;
}) {
  return (
    <div className={`${color} p-4 rounded-lg`}>
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold ${textColor}`}>
        {decimal ? value.toFixed(1) : value}
      </dd>
    </div>
  );
}
