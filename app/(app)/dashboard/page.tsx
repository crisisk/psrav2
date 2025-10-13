/**
 * Compliance Manager Dashboard (Suus)
 * /dashboard
 *
 * Principal Engineer redesign x100
 * - Hero with latest assessments
 * - Quick action CTAs
 * - Key metrics (Insights)
 * - Assessments table with filters
 * - Missing CoO workflow
 */

'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  Filter,
  Mail
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
interface Assessment {
  id: string
  productName: string
  hsCode: string
  verdict: 'GO' | 'NO_GO' | 'PENDING'
  agreement: string
  createdAt: string
  confidence?: number
}

interface InsightsData {
  p95Latency: number
  passFailLast7d: { pass: number; fail: number }
  exceptionsOpen: number
  ltsdDueSoon: number
}

interface MissingCoONode {
  id: string
  ltsdId: string
  materialName: string
  hsCode: string
  supplierName?: string
  requestedAt?: string
}

// Mock data for development
const MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 'asmt-001',
    productName: 'Industrial Valve Assembly',
    hsCode: '8481.80.59',
    verdict: 'GO',
    agreement: 'EU-Vietnam FTA',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    confidence: 0.95
  },
  {
    id: 'asmt-002',
    productName: 'Copper Wire Rod',
    hsCode: '7408.11.00',
    verdict: 'GO',
    agreement: 'CETA',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    confidence: 0.89
  },
  {
    id: 'asmt-003',
    productName: 'Textile Fabric Roll',
    hsCode: '5209.39.00',
    verdict: 'NO_GO',
    agreement: 'EU-South Korea FTA',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    confidence: 0.67
  }
]

const MOCK_INSIGHTS: InsightsData = {
  p95Latency: 1.8,
  passFailLast7d: { pass: 42, fail: 3 },
  exceptionsOpen: 2,
  ltsdDueSoon: 5
}

const MOCK_MISSING_COO: MissingCoONode[] = [
  {
    id: 'node-001',
    ltsdId: 'ltsd-12345',
    materialName: 'Steel Sheet Component',
    hsCode: '7209.18.10',
    supplierName: 'Metalworks B.V.'
  },
  {
    id: 'node-002',
    ltsdId: 'ltsd-12345',
    materialName: 'Plastic Housing',
    hsCode: '3917.32.00',
    supplierName: 'PlasticCo GmbH'
  },
  {
    id: 'node-003',
    ltsdId: 'ltsd-12346',
    materialName: 'Electronic Circuit Board',
    hsCode: '8534.00.00',
  }
]

export default function DashboardPage() {
  const { track } = useTelemetry()
  const [filterVerdict, setFilterVerdict] = useState<'ALL' | 'GO' | 'NO_GO' | 'PENDING'>('ALL')

  useEffect(() => {
    track('dashboard_mount')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fetch latest assessments
  const { data: assessments = MOCK_ASSESSMENTS, isLoading: loadingAssessments } = useQuery({
    queryKey: ['assessments', 'recent'],
    queryFn: async () => {
      // TODO: Replace with real API call
      // const res = await fetch('/api/assessments?limit=20')
      // return res.json()
      return MOCK_ASSESSMENTS
    },
    staleTime: 30000
  })

  // Fetch insights
  const { data: insights = MOCK_INSIGHTS, isLoading: loadingInsights } = useQuery({
    queryKey: ['insights', 'overview'],
    queryFn: async () => {
      // TODO: Replace with real API call
      // const res = await fetch('/api/insights/overview')
      // return res.json()
      return MOCK_INSIGHTS
    },
    staleTime: 60000
  })

  // Fetch missing CoO nodes
  const { data: missingCoO = MOCK_MISSING_COO, isLoading: loadingMissingCoO } = useQuery({
    queryKey: ['chain', 'missing-coo'],
    queryFn: async () => {
      // TODO: Replace with real API call
      // const res = await fetch('/api/chain/missing-coo')
      // return res.json()
      return MOCK_MISSING_COO
    },
    staleTime: 30000
  })

  const handleRequestCoO = async (node: MissingCoONode) => {
    track('coo_request_click', { nodeId: node.id, ltsdId: node.ltsdId })

    try {
      // TODO: Replace with real API call
      // await fetch(`/api/chain/${node.ltsdId}/node/${node.id}/request-coo`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ recipientEmail: 'test@test.com' })
      // })

      console.log('CoO request sent for node:', node.id)
      alert(`✅ CoO request sent to ${node.supplierName || 'test@test.com'}`)
      track('coo_request_sent', { nodeId: node.id, success: true })
    } catch (error) {
      console.error('Failed to request CoO:', error)
      track('coo_request_sent', { nodeId: node.id, success: false })
    }
  }

  const latestThree = assessments.slice(0, 3)
  const filteredAssessments = filterVerdict === 'ALL'
    ? assessments
    : assessments.filter(a => a.verdict === filterVerdict)

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base via-bg-surface to-bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Compliance Manager Dashboard
              </h1>
              <p className="text-text-secondary">
                Welcome back, Suus! Here's your trade compliance overview.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-lg text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                System Operational
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Hero: Latest 3 Assessments */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Latest Assessments
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {latestThree.map((assessment) => (
              <article
                key={assessment.id}
                className="bg-white rounded-xl border border-border-subtle p-6 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    assessment.verdict === 'GO'
                      ? 'bg-success/10 text-success'
                      : assessment.verdict === 'NO_GO'
                      ? 'bg-danger/10 text-danger'
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {assessment.verdict === 'GO' ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : assessment.verdict === 'NO_GO' ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                    {assessment.verdict}
                  </div>
                  {assessment.confidence && (
                    <span className="text-xs text-text-muted">
                      {Math.round(assessment.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-text-primary mb-2 group-hover:text-sevensa-teal transition-colors">
                  {assessment.productName}
                </h3>
                <p className="text-sm text-text-secondary mb-1">
                  HS Code: <span className="font-mono font-medium">{assessment.hsCode}</span>
                </p>
                <p className="text-sm text-text-secondary mb-3">
                  {assessment.agreement}
                </p>
                <p className="text-xs text-text-muted">
                  {new Date(assessment.createdAt).toLocaleString('nl-NL')}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* CTA Strip */}
        <section className="grid md:grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-sevensa-teal to-sevensa-teal-600 hover:from-sevensa-teal-600 hover:to-sevensa-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            <span>Start New Origin Check</span>
          </button>
          <button className="flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-sevensa-teal text-sevensa-teal hover:bg-sevensa-teal hover:text-white font-semibold rounded-xl transition-all group">
            <FileText className="w-5 h-5" />
            <span>Generate New LTSD</span>
          </button>
        </section>

        {/* Insights Row */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Key Metrics
          </h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              {
                label: 'P95 Latency',
                value: `${insights.p95Latency}s`,
                icon: Clock,
                color: 'sevensa-teal',
                trend: 'Good'
              },
              {
                label: 'Pass/Fail (7d)',
                value: `${insights.passFailLast7d.pass}/${insights.passFailLast7d.fail}`,
                icon: TrendingUp,
                color: 'success',
                trend: `${Math.round((insights.passFailLast7d.pass / (insights.passFailLast7d.pass + insights.passFailLast7d.fail)) * 100)}% pass rate`
              },
              {
                label: 'Open Exceptions',
                value: insights.exceptionsOpen.toString(),
                icon: AlertTriangle,
                color: insights.exceptionsOpen > 0 ? 'warning' : 'success',
                trend: insights.exceptionsOpen > 0 ? 'Needs attention' : 'All clear'
              },
              {
                label: 'LTSD Due Soon',
                value: insights.ltsdDueSoon.toString(),
                icon: Calendar,
                color: insights.ltsdDueSoon > 3 ? 'warning' : 'info',
                trend: `Next 30 days`
              }
            ].map((metric, i) => {
              const Icon = metric.icon
              return (
                <div key={i} className="bg-white rounded-xl border border-border-subtle p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 bg-${metric.color}/10 rounded-lg`}>
                      <Icon className={`w-5 h-5 text-${metric.color}`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-text-primary mb-1">
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium text-text-secondary mb-1">
                    {metric.label}
                  </div>
                  <div className="text-xs text-text-muted">
                    {metric.trend}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Missing CoO Section */}
        {missingCoO.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-text-primary">
                Missing Certificates of Origin
              </h2>
              <span className="px-3 py-1 bg-warning/10 text-warning rounded-full text-sm font-medium">
                {missingCoO.length} pending
              </span>
            </div>
            <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-muted border-b border-border-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Material</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">HS Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Supplier</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">LTSD ID</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {missingCoO.map((node) => (
                    <tr key={node.id} className="hover:bg-bg-surface transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">
                        {node.materialName}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                        {node.hsCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {node.supplierName || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-text-muted">
                        {node.ltsdId}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleRequestCoO(node)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-sevensa-teal hover:bg-sevensa-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          Request CoO
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Assessments Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              All Assessments
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFilterVerdict('ALL')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterVerdict === 'ALL'
                    ? 'bg-sevensa-teal text-white'
                    : 'bg-white border border-border-subtle text-text-secondary hover:bg-bg-surface'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterVerdict('GO')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterVerdict === 'GO'
                    ? 'bg-success text-white'
                    : 'bg-white border border-border-subtle text-text-secondary hover:bg-bg-surface'
                }`}
              >
                GO
              </button>
              <button
                onClick={() => setFilterVerdict('NO_GO')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterVerdict === 'NO_GO'
                    ? 'bg-danger text-white'
                    : 'bg-white border border-border-subtle text-text-secondary hover:bg-bg-surface'
                }`}
              >
                NO_GO
              </button>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-muted border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">HS Code</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Verdict</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Agreement</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-bg-surface transition-colors cursor-pointer">
                    <td className="px-6 py-4 text-sm font-medium text-text-primary">
                      {assessment.productName}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                      {assessment.hsCode}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        assessment.verdict === 'GO'
                          ? 'bg-success/10 text-success'
                          : assessment.verdict === 'NO_GO'
                          ? 'bg-danger/10 text-danger'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {assessment.verdict === 'GO' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : assessment.verdict === 'NO_GO' ? (
                          <XCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {assessment.verdict}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary">
                      {assessment.agreement}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-muted">
                      {new Date(assessment.createdAt).toLocaleDateString('nl-NL')}
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
