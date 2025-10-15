"use client";
import { useEffect, useState } from 'react';

export interface Assessment {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
}

interface ApiResponse {
  data: Assessment[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function AssessmentList() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/assessments?page=${page}&pageSize=${pageSize}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const result = await res.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [page, pageSize]);

  const handlePrevious = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(p + 1, data?.totalPages || 1));

  if (isLoading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.data.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">{assessment.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    assessment.status === 'approved' ? 'bg-green-100 text-green-800' :
                    assessment.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assessment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(assessment.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Page {data?.currentPage} of {data?.totalPages} ({data?.totalItems} total items)
        </div>
        <div className="space-x-2">
          <button
            onClick={handlePrevious}
            disabled={page === 1}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              page === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={page === data?.totalPages}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              page === data?.totalPages
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
