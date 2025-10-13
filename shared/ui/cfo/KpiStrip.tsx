import { DollarSign, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { trackEvent } from '@/shared/lib/telemetry';
import { formatCurrency, formatDuration } from '@/shared/utils/format';

interface CfoKpisSchema {
  savingsMtd: number;
  atRisk: number;
  avgDecisionTime: number;
  openApprovals: number;
}

export const KpiStrip = () => {
  const { data: kpis } = useQuery<CfoKpisSchema>({
    queryKey: ['cfo-kpis'],
    queryFn: () => fetch('/api/cfo/kpis').then(res => res.json()),
  });

  if (!kpis) return null;

  const kpiCards = [
    {
      label: 'Monthly Savings',
      value: formatCurrency(kpis.savingsMtd),
      icon: DollarSign,
      color: '#00A896',
      onClick: () => trackEvent('dashboard_metric_click', { metric: 'savings' })
    },
    {
      label: 'At Risk',
      value: formatCurrency(kpis.atRisk),
      icon: AlertTriangle,
      color: '#FFA500',
      onClick: () => trackEvent('dashboard_metric_click', { metric: 'risk' })
    },
    {
      label: 'Avg Decision Time',
      value: formatDuration(kpis.avgDecisionTime),
      icon: Clock,
      color: '#00A896',
      onClick: () => trackEvent('dashboard_metric_click', { metric: 'time' })
    },
    {
      label: 'Open Approvals',
      value: kpis.openApprovals.toString(),
      icon: CheckCircle2,
      color: '#4A90E2',
      onClick: () => trackEvent('dashboard_metric_click', { metric: 'approvals' })
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-dark-bg-surface rounded-lg shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
            onClick={card.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{card.label}</p>
                <p className="text-xl font-semibold mt-1">{card.value}</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${card.color}20` }}>
                <Icon className="h-6 w-6" style={{ color: card.color }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
