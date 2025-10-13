import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { trackEvent } from '@/shared/lib/telemetry';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type Assessment = {
  id: string;
  productName: string;
  hsCode: string;
  verdict: 'GO' | 'NO_GO' | 'PENDING' | 'REVIEW';
  agreement: string;
  status: string;
  date: string;
};

type FilterChip = 'ALL' | 'GO' | 'NO_GO' | 'PENDING';

export function AssessmentsTable() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterChip>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      const response = await fetch('/api/assessments');
      const data = await response.json();
      setAssessments(data);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssessments = assessments.filter(assessment => {
    if (activeFilter === 'ALL') return true;
    return assessment.verdict === activeFilter;
  });

  const handleRowClick = (id: string) => {
    trackEvent('assessment_open', { assessmentId: id });
    router.push(`/assessment/${id}`);
  };

  const getVerdictColor = (verdict: Assessment['verdict']) => {
    const colors = {
      GO: 'bg-green-100 text-green-800',
      NO_GO: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEW: 'bg-blue-100 text-blue-800'
    };
    return colors[verdict];
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 mb-4">
        {['ALL', 'GO', 'NO_GO', 'PENDING'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter as FilterChip)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium',
              activeFilter === filter
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl shadow-card">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                HS Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Verdict
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agreement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssessments.map((assessment) => (
              <tr
                key={assessment.id}
                onClick={() => handleRowClick(assessment.id)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {assessment.productName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assessment.hsCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getVerdictColor(assessment.verdict)
                  )}>
                    {assessment.verdict}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assessment.agreement}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assessment.status}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assessment.date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && filteredAssessments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No assessments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
