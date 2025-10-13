/**
 * CFO/Manager Dashboard
 * /cfo
 *
 * Principal Engineer redesign x100
 * - Executive KPI strip
 * - Pass/Fail trend analysis
 * - Savings breakdown by agreement
 * - At-risk products monitoring
 * - Approval workflow
 */

'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ChevronRight,
  BarChart3
} from 'lucide-react'

// Telemetry
const useTelemetry = () => {
  const track = (event: string, data?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      // @ts-ignore
      if (window.gtag) window.gtag('event', event, data)
    }
    console.log('[Telemetry]', event, data)
  }
  return { track }
}

// Types
interface KPIData {
  savingsMTD: number
  savingsMTDChange: number
  atRiskCount: number
  atRiskChange: number
  avgDecisionTime: number
  avgDecisionTimeChange: number
  openApprovals: number
  openApprovalsChange: number
}

interface TrendData {
  date: string
  pass: number
  fail: number
}

interface SavingsByAgreement {
  agreement: string
  savings: number
  count: number
  percentage: number
}

interface AtRiskProduct {
  id: string
  productName: string
  hsCode: string
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
  potentialLoss: number
  ltsdId?: string
}

interface Approval {
  id: string
  type: 'ASSESSMENT' | 'LTSD' | 'EXCEPTION'
  productName: string
  requestedBy: string
  requestedAt: string
  urgency: 'HIGH' | 'NORMAL' | 'LOW'
  estimatedSavings?: number
}

// Mock data
const MOCK_KPI: KPIData = {
  savingsMTD: 24567,
  savingsMTDChange: 12.5,
  atRiskCount: 2,
  atRiskChange: -50, // Good - decreased from 4 to 2
  avgDecisionTime: 1.8,
  avgDecisionTimeChange: -15.2, // Good - faster
  openApprovals: 5,
  openApprovalsChange: 25
}

const MOCK_TREND: TrendData[] = [
  { date: '2025-10-06', pass: 8, fail: 1 },
  { date: '2025-10-07', pass: 6, fail: 0 },
  { date: '2025-10-08', pass: 5, fail: 1 },
  { date: '2025-10-09', pass: 7, fail: 0 },
  { date: '2025-10-10', pass: 4, fail: 0 },
  { date: '2025-10-11', pass: 6, fail: 1 },
  { date: '2025-10-12', pass: 6, fail: 0 }
]

const MOCK_SAVINGS: SavingsByAgreement[] = [
  { agreement: 'EU-Vietnam FTA', savings: 8950, count: 12, percentage: 36.4 },
  { agreement: 'CETA', savings: 7200, count: 8, percentage: 29.3 },
  { agreement: 'EU-South Korea FTA', savings: 5417, count: 15, percentage: 22.1 },
  { agreement: 'EFTA', savings: 3000, count: 7, percentage: 12.2 }
]

const MOCK_AT_RISK: AtRiskProduct[] = [
  {
    id: 'risk-001',
    productName: 'Steel Component Assembly',
    hsCode: '7326.19.00',
    riskLevel: 'HIGH',
    reason: 'Missing supplier CoO for 3 components',
    potentialLoss: 4500,
    ltsdId: 'ltsd-12349'
  },
  {
    id: 'risk-002',
    productName: 'Electronic Module',
    hsCode: '8537.10.99',
    riskLevel: 'MEDIUM',
    reason: 'Conflicting origin documentation',
    potentialLoss: 2100,
    ltsdId: 'ltsd-12350'
  }
]

const MOCK_APPROVALS: Approval[] = [
  {
    id: 'appr-001',
    type: 'LTSD',
    productName: 'Automotive Part XK-2400',
    requestedBy: 'Suus van der Berg',
    requestedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    urgency: 'HIGH',
    estimatedSavings: 3400
  },
  {
    id: 'appr-002',
    type: 'EXCEPTION',
    productName: 'Textile Material Roll',
    requestedBy: 'Suus van der Berg',
    requestedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    urgency: 'NORMAL',
    estimatedSavings: 1200
  },
  {
    id: 'appr-003',
    type: 'ASSESSMENT',
    productName: 'Industrial Valve',
    requestedBy: 'Compliance Team',
    requestedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    urgency: 'NORMAL'
  },
  {
    id: 'appr-004',
    type: 'LTSD',
    productName: 'Copper Wire Assembly',
    requestedBy: 'Suus van der Berg',
    requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    urgency: 'LOW',
    estimatedSavings: 890
  },
  {
    id: 'appr-005',
    type: 'ASSESSMENT',
    productName: 'Plastic Housing Unit',
    requestedBy: 'Operations',
    requestedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    urgency: 'NORMAL'
  }
]

export default function CFODashboardPage() {
  const { track } = useTelemetry()

  useEffect(() => {
    track('cfo_dashboard_mount')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch KPIs
  const { data: kpis = MOCK_KPI } = useQuery({
    queryKey: ['cfo', 'kpis'],
    queryFn: async () => MOCK_KPI,
    staleTime: 60000
  })

  // Fetch trend
  const { data: trend = MOCK_TREND } = useQuery({
    queryKey: ['cfo', 'trend'],
    queryFn: async () => MOCK_TREND,
    staleTime: 60000
  })

  // Fetch savings
  const { data: savings = MOCK_SAVINGS } = useQuery({
    queryKey: ['cfo', 'savings'],
    queryFn: async () => MOCK_SAVINGS,
    staleTime: 60000
  })

  // Fetch at-risk
  const { data: atRisk = MOCK_AT_RISK } = useQuery({
    queryKey: ['cfo', 'at-risk'],
    queryFn: async () => MOCK_AT_RISK,
    staleTime: 30000
  })

  // Fetch approvals
  const { data: approvals = MOCK_APPROVALS } = useQuery({
    queryKey: ['cfo', 'approvals'],
    queryFn: async () => MOCK_APPROVALS,
    staleTime: 30000
  })

  const handleApprove = (approvalId: string) => {
    track('cfo_approval_action', { approvalId, action: 'approve' })
    alert(`✅ Approved: ${approvalId}`)
  }

  const totalPass = trend.reduce((sum, d) => sum + d.pass, 0)
  const totalFail = trend.reduce((sum, d) => sum + d.fail, 0)
  const passRate = Math.round((totalPass / (totalPass + totalFail)) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base via-bg-surface to-bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                CFO Dashboard
              </h1>
              <p className="text-text-secondary">
                Financial overview, risk monitoring, and approval management
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-success">
                  €{(kpis.savingsMTD / 1000).toFixed(1)}K
                </div>
                <div className="text-xs text-text-muted">MTD Savings</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Strip */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Key Performance Indicators
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                label: 'Savings MTD',
                value: `€${(kpis.savingsMTD / 1000).toFixed(1)}K`,
                change: kpis.savingsMTDChange,
                icon: DollarSign,
                color: 'success',
                positive: kpis.savingsMTDChange > 0
              },
              {
                label: 'At-Risk Products',
                value: kpis.atRiskCount.toString(),
                change: kpis.atRiskChange,
                icon: AlertTriangle,
                color: kpis.atRiskCount > 0 ? 'warning' : 'success',
                positive: kpis.atRiskChange < 0 // Lower is better
              },
              {
                label: 'Avg Decision Time',
                value: `${kpis.avgDecisionTime}s`,
                change: kpis.avgDecisionTimeChange,
                icon: Clock,
                color: 'info',
                positive: kpis.avgDecisionTimeChange < 0 // Lower is better
              },
              {
                label: 'Open Approvals',
                value: kpis.openApprovals.toString(),
                change: kpis.openApprovalsChange,
                icon: CheckCircle,
                color: 'sevensa-teal',
                positive: kpis.openApprovalsChange < 0 // Lower is better
              }
            ].map((kpi, i) => {
              const Icon = kpi.icon
              const TrendIcon = kpi.positive ? TrendingUp : TrendingDown
              return (
                <div key={i} className="bg-white rounded-xl border border-border-subtle p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 bg-${kpi.color}/10 rounded-lg`}>
                      <Icon className={`w-5 h-5 text-${kpi.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-medium ${
                      kpi.positive ? 'text-success' : 'text-danger'
                    }`}>
                      <TrendIcon className="w-4 h-4" />
                      {Math.abs(kpi.change)}%
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-text-primary mb-1">
                    {kpi.value}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {kpi.label}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Pass/Fail Trend */}
        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-border-subtle p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-text-primary">
                Pass/Fail Trend (7 Days)
              </h3>
              <BarChart3 className="w-5 h-5 text-text-muted" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-success" />
                  <div>
                    <div className="text-2xl font-bold text-success">{totalPass}</div>
                    <div className="text-sm text-text-secondary">Passed</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-success">{passRate}%</div>
              </div>
              <div className="flex items-center justify-between p-4 bg-danger/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircle className="w-8 h-8 text-danger" />
                  <div>
                    <div className="text-2xl font-bold text-danger">{totalFail}</div>
                    <div className="text-sm text-text-secondary">Failed</div>
                  </div>
                </div>
                <div className="text-lg font-semibold text-text-muted">{100 - passRate}%</div>
              </div>
              <div className="pt-4 border-t border-border-subtle">
                <div className="text-sm text-text-secondary mb-2">Daily Breakdown:</div>
                <div className="space-y-2">
                  {trend.slice(-3).reverse().map((day, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">
                        {new Date(day.date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-success font-medium">{day.pass} pass</span>
                        <span className="text-danger font-medium">{day.fail} fail</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Savings by Agreement */}
          <div className="bg-white rounded-xl border border-border-subtle p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-6">
              Savings by Agreement
            </h3>
            <div className="space-y-4">
              {savings.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-text-primary">{item.agreement}</div>
                      <div className="text-sm text-text-muted">{item.count} assessments</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-success">€{(item.savings / 1000).toFixed(1)}K</div>
                      <div className="text-sm text-text-muted">{item.percentage}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-bg-muted rounded-full h-2">
                    <div
                      className="bg-sevensa-teal rounded-full h-2 transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* At-Risk Products */}
        {atRisk.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">
                At-Risk Products
              </h2>
              <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
                {atRisk.length} products
              </span>
            </div>
            <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-muted border-b border-border-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">HS Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Risk Level</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Reason</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">Potential Loss</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {atRisk.map((product) => (
                    <tr key={product.id} className="hover:bg-bg-surface transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">
                        {product.productName}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                        {product.hsCode}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          product.riskLevel === 'HIGH'
                            ? 'bg-danger/10 text-danger'
                            : product.riskLevel === 'MEDIUM'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-info/10 text-info'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          {product.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {product.reason}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-danger">
                        €{(product.potentialLoss / 1000).toFixed(1)}K
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Pending Approvals */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              Pending Approvals
            </h2>
            <span className="px-3 py-1 bg-sevensa-teal/10 text-sevensa-teal rounded-full text-sm font-medium">
              {approvals.length} pending
            </span>
          </div>
          <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-muted border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Requested By</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Urgency</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Est. Savings</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {approvals.map((approval) => (
                  <tr key={approval.id} className="hover:bg-bg-surface transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 bg-sevensa-teal/10 text-sevensa-teal rounded-md text-xs font-medium">
                        {approval.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {approval.productName}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {approval.requestedBy}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        approval.urgency === 'HIGH'
                          ? 'bg-danger/10 text-danger'
                          : approval.urgency === 'NORMAL'
                          ? 'bg-info/10 text-info'
                          : 'bg-bg-muted text-text-muted'
                      }`}>
                        {approval.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-success">
                      {approval.estimatedSavings ? `€${(approval.estimatedSavings / 1000).toFixed(1)}K` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 hover:bg-bg-surface rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-text-muted" />
                        </button>
                        <button
                          onClick={() => handleApprove(approval.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-success hover:bg-success/90 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
