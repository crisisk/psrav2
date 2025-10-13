import { Clock, TrendingUp, AlertTriangle, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

interface InsightsOverviewSchema {
  p95Latency: number
  passFailLast7d: {
    pass: number
    fail: number
  }
  exceptionsOpen: number
  ltsdDueSoon: number
}

async function fetchInsightsOverview(): Promise<InsightsOverviewSchema> {
  const response = await fetch('/api/insights/overview')
  if (!response.ok) {
    throw new Error('Failed to fetch insights overview')
  }
  return response.json()
}

export function InsightsRow() {
  const { data, isLoading } = useQuery<InsightsOverviewSchema>({
    queryKey: ['insights-overview'],
    queryFn: fetchInsightsOverview
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white dark:bg-dark-bg-surface shadow-card rounded-xl p-4">
        {isLoading ? (
          <div className="h-16 animate-pulse bg-gray-100 dark:bg-gray-800 rounded" />
        ) : (
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-info" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">P95 Latency</div>
              <div className="text-xl font-semibold">{data?.p95Latency}ms</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-bg-surface shadow-card rounded-xl p-4">
        {isLoading ? (
          <div className="h-16 animate-pulse bg-gray-100 dark:bg-gray-800 rounded" />
        ) : (
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-success" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pass/Fail 7d</div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-semibold text-success">{data?.passFailLast7d.pass}</span>
                <span className="text-gray-400">/</span>
                <span className="text-xl font-semibold text-error">{data?.passFailLast7d.fail}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-bg-surface shadow-card rounded-xl p-4">
        {isLoading ? (
          <div className="h-16 animate-pulse bg-gray-100 dark:bg-gray-800 rounded" />
        ) : (
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Exceptions Open</div>
              <div className="text-xl font-semibold">{data?.exceptionsOpen}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-dark-bg-surface shadow-card rounded-xl p-4">
        {isLoading ? (
          <div className="h-16 animate-pulse bg-gray-100 dark:bg-gray-800 rounded" />
        ) : (
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-warning" />
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">LTSD Due Soon</div>
              <div className="text-xl font-semibold">{data?.ltsdDueSoon}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
