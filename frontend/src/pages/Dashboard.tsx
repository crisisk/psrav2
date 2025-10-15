import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AppLayout } from '../components/layout/AppLayout'
import { apiClient } from '../lib/api'
import { LoadingSpinner } from '../components/layout/LoadingSpinner'

interface DashboardStats {
  total_certificates: number
  active_certificates: number
  expired_certificates: number
  total_evaluations: number
  compliant_percentage: number
  total_rules: number
  total_ftas: number
  recent_activity_count: number
}

interface RecentActivity {
  id: string
  type: 'certificate' | 'evaluation' | 'rule'
  description: string
  timestamp: string
  status?: string
}

const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/api/statistics/dashboard')
  return response.data
}

const fetchRecentActivity = async (): Promise<RecentActivity[]> => {
  // Mock data for now - replace with actual API call when available
  return [
    {
      id: '1',
      type: 'certificate',
      description: 'New certificate created: COO-2024-001',
      timestamp: new Date().toISOString(),
      status: 'active',
    },
    {
      id: '2',
      type: 'evaluation',
      description: 'Compliance check completed: EVAL-2024-045',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'compliant',
    },
    {
      id: '3',
      type: 'rule',
      description: 'Rule updated: EU-UK FTA Chapter 4',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ]
}

const Dashboard = () => {
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  useEffect(() => {
    fetchRecentActivity().then(setRecentActivity)
  }, [])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold">Error Loading Dashboard</h3>
            <p className="text-red-600 mt-2">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const statCards = [
    {
      title: 'Total Certificates',
      value: stats?.total_certificates || 0,
      icon: '📄',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-900',
    },
    {
      title: 'Active Certificates',
      value: stats?.active_certificates || 0,
      icon: '✅',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900',
    },
    {
      title: 'Expired Certificates',
      value: stats?.expired_certificates || 0,
      icon: '⏰',
      color: 'bg-orange-50 border-orange-200',
      textColor: 'text-orange-900',
    },
    {
      title: 'Total Evaluations',
      value: stats?.total_evaluations || 0,
      icon: '🔍',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-900',
    },
    {
      title: 'Compliance Rate',
      value: `${stats?.compliant_percentage?.toFixed(1) || 0}%`,
      icon: '📊',
      color: 'bg-teal-50 border-teal-200',
      textColor: 'text-teal-900',
    },
    {
      title: 'Total Rules',
      value: stats?.total_rules || 0,
      icon: '📋',
      color: 'bg-indigo-50 border-indigo-200',
      textColor: 'text-indigo-900',
    },
    {
      title: 'FTA Agreements',
      value: stats?.total_ftas || 0,
      icon: '🌍',
      color: 'bg-cyan-50 border-cyan-200',
      textColor: 'text-cyan-900',
    },
    {
      title: 'Recent Activities',
      value: stats?.recent_activity_count || 0,
      icon: '🔔',
      color: 'bg-pink-50 border-pink-200',
      textColor: 'text-pink-900',
    },
  ]

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to PSRA LTSD - Your Trade Compliance Platform
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={`${card.color} border rounded-lg p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-3xl font-bold ${card.textColor} mt-2`}>
                    {card.value}
                  </p>
                </div>
                <div className="text-4xl opacity-50">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => (window.location.href = '/certificates')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">📄</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">New Certificate</div>
                <div className="text-sm text-gray-600">Create a new certificate</div>
              </div>
            </button>
            <button
              onClick={() => (window.location.href = '/compliance')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">🔍</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Compliance Check</div>
                <div className="text-sm text-gray-600">Run a compliance evaluation</div>
              </div>
            </button>
            <button
              onClick={() => (window.location.href = '/rules')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl">📋</span>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Search Rules</div>
                <div className="text-sm text-gray-600">Find applicable rules</div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">
                    {activity.type === 'certificate' && '📄'}
                    {activity.type === 'evaluation' && '🔍'}
                    {activity.type === 'rule' && '📋'}
                  </span>
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium">{activity.description}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {activity.status && (
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${
                        activity.status === 'active' || activity.status === 'compliant'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {activity.status}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">API Server</div>
                <div className="text-sm text-gray-600">Operational</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">ML Services</div>
                <div className="text-sm text-gray-600">Operational</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <div className="font-medium text-gray-900">Database</div>
                <div className="text-sm text-gray-600">Operational</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

export default Dashboard
