/**
 * XAI Result Explainer - Production Redesign
 * /assessment/[id]
 *
 * x100 Design Quality:
 * - Decision Summary with verdict hero
 * - Rule Path visualization (CTH/CTSH/VA/WO)
 * - BOM tree with coverage %
 * - Data Inputs (HS/BoM/CoO)
 * - Trace & Confidence scores
 * - Next Best Actions
 */

'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  TrendingUp,
  Package,
  GitBranch,
  Eye,
  ChevronRight,
  Clock,
  Brain,
  Target,
  Lightbulb,
  ArrowRight
} from 'lucide-react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Assessment {
  id: string
  ltsdId: string
  hsCode: string
  productName: string
  verdict: 'GO' | 'NO_GO' | 'PENDING' | 'REVIEW'
  agreement: string
  confidence: number
  createdAt: string
  completedAt: string
  decisionReason: string
  savingsAmount?: number
  processingTime: number
}

interface RuleCheckpoint {
  id: string
  name: string
  type: 'CTH' | 'CTSH' | 'VA' | 'WO'
  passed: boolean
  threshold?: string
  actual?: string
  description: string
}

interface BOMNode {
  id: string
  name: string
  hsCode: string
  origin: string
  value: number
  hasCertificate: boolean
  children?: BOMNode[]
}

interface DataInput {
  category: string
  label: string
  value: string
  verified: boolean
}

interface TraceStep {
  step: number
  action: string
  result: string
  confidence: number
  duration: number
}

interface NextAction {
  id: string
  type: 'primary' | 'secondary' | 'info'
  title: string
  description: string
  icon: any
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_ASSESSMENT: Assessment = {
  id: 'assessment-001',
  ltsdId: 'LTSD-2025-001',
  hsCode: '8537.10.99',
  productName: 'Automotive Electronic Module XK-2400',
  verdict: 'GO',
  agreement: 'EU-Vietnam FTA',
  confidence: 0.94,
  createdAt: '2025-10-13T09:15:00Z',
  completedAt: '2025-10-13T09:15:02Z',
  decisionReason: 'Product qualifies under CTH rule with sufficient regional value content (52% > 45% threshold)',
  savingsAmount: 3420,
  processingTime: 1.8
}

const MOCK_RULE_PATH: RuleCheckpoint[] = [
  {
    id: 'rule-1',
    name: 'Change in Tariff Heading (CTH)',
    type: 'CTH',
    passed: true,
    threshold: '4-digit change required',
    actual: '8534 → 8537 (compliant)',
    description: 'All non-originating materials undergo sufficient transformation'
  },
  {
    id: 'rule-2',
    name: 'Change in Tariff Subheading (CTSH)',
    type: 'CTSH',
    passed: true,
    threshold: '6-digit change required',
    actual: '8534.00 → 8537.10 (compliant)',
    description: 'Materials classified under different subheadings'
  },
  {
    id: 'rule-3',
    name: 'Value Added (VA)',
    type: 'VA',
    passed: true,
    threshold: '≥ 45% regional content',
    actual: '52% regional content',
    description: 'Regional value content exceeds minimum threshold'
  },
  {
    id: 'rule-4',
    name: 'Wholly Obtained (WO)',
    type: 'WO',
    passed: false,
    threshold: '100% originating materials',
    actual: '68% originating materials',
    description: 'Not applicable - product uses imported components'
  }
]

const MOCK_BOM_TREE: BOMNode = {
  id: 'root',
  name: 'Electronic Module XK-2400',
  hsCode: '8537.10.99',
  origin: 'Vietnam',
  value: 100,
  hasCertificate: true,
  children: [
    {
      id: 'node-1',
      name: 'PCB Assembly',
      hsCode: '8534.00.00',
      origin: 'Vietnam',
      value: 35,
      hasCertificate: true,
      children: [
        {
          id: 'node-1-1',
          name: 'Copper Substrate',
          hsCode: '7410.21.00',
          origin: 'China',
          value: 12,
          hasCertificate: true
        },
        {
          id: 'node-1-2',
          name: 'Semiconductor IC',
          hsCode: '8542.31.00',
          origin: 'Vietnam',
          value: 18,
          hasCertificate: true
        }
      ]
    },
    {
      id: 'node-2',
      name: 'Connector Set',
      hsCode: '8536.69.00',
      origin: 'Vietnam',
      value: 15,
      hasCertificate: true
    },
    {
      id: 'node-3',
      name: 'Capacitor Array',
      hsCode: '8532.24.00',
      origin: 'Japan',
      value: 20,
      hasCertificate: true
    },
    {
      id: 'node-4',
      name: 'Plastic Housing',
      hsCode: '3926.90.98',
      origin: 'Vietnam',
      value: 10,
      hasCertificate: true
    }
  ]
}

const MOCK_DATA_INPUTS: DataInput[] = [
  { category: 'Product', label: 'HS Code', value: '8537.10.99', verified: true },
  { category: 'Product', label: 'Product Name', value: 'Automotive Electronic Module XK-2400', verified: true },
  { category: 'Product', label: 'Country of Manufacture', value: 'Vietnam', verified: true },
  { category: 'Trade', label: 'Trade Agreement', value: 'EU-Vietnam FTA', verified: true },
  { category: 'Trade', label: 'Export Market', value: 'European Union', verified: true },
  { category: 'BOM', label: 'Total Components', value: '7 items', verified: true },
  { category: 'BOM', label: 'Regional Content', value: '52%', verified: true },
  { category: 'Certificates', label: 'CoO Coverage', value: '100% (7/7 nodes)', verified: true },
  { category: 'Certificates', label: 'Missing Certificates', value: '0', verified: true }
]

const MOCK_TRACE: TraceStep[] = [
  {
    step: 1,
    action: 'Parse input data',
    result: 'Successfully extracted HS code, BoM structure, and CoO documents',
    confidence: 1.0,
    duration: 0.2
  },
  {
    step: 2,
    action: 'Identify applicable trade agreement',
    result: 'EU-Vietnam FTA selected based on export destination',
    confidence: 0.98,
    duration: 0.3
  },
  {
    step: 3,
    action: 'Evaluate CTH/CTSH rules',
    result: 'Material transformation satisfies CTH (4-digit) and CTSH (6-digit) requirements',
    confidence: 0.95,
    duration: 0.5
  },
  {
    step: 4,
    action: 'Calculate regional value content',
    result: 'Computed 52% regional content (≥ 45% threshold)',
    confidence: 0.92,
    duration: 0.4
  },
  {
    step: 5,
    action: 'Verify certificate chain',
    result: 'All 7 BOM nodes have valid CoO certificates',
    confidence: 0.97,
    duration: 0.4
  },
  {
    step: 6,
    action: 'Final decision',
    result: 'Product qualifies for preferential treatment (GO verdict)',
    confidence: 0.94,
    duration: 0.0
  }
]

const MOCK_NEXT_ACTIONS_GO: NextAction[] = [
  {
    id: 'action-1',
    type: 'primary',
    title: 'Generate LTSD Certificate',
    description: 'Create Long-Term Supplier Declaration for this supply chain',
    icon: FileText
  },
  {
    id: 'action-2',
    type: 'secondary',
    title: 'Export Audit Pack',
    description: 'Download complete documentation package for customs',
    icon: Download
  },
  {
    id: 'action-3',
    type: 'info',
    title: 'Monitor Supply Chain',
    description: 'Set up alerts for certificate expiry and supplier changes',
    icon: Eye
  }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AssessmentDetailPage() {
  const params = useParams()
  const assessmentId = params.id as string

  const [assessment] = useState<Assessment>(MOCK_ASSESSMENT)
  const [rulePath] = useState<RuleCheckpoint[]>(MOCK_RULE_PATH)
  const [bomTree] = useState<BOMNode>(MOCK_BOM_TREE)
  const [dataInputs] = useState<DataInput[]>(MOCK_DATA_INPUTS)
  const [trace] = useState<TraceStep[]>(MOCK_TRACE)
  const [nextActions] = useState<NextAction[]>(MOCK_NEXT_ACTIONS_GO)

  const isGO = assessment.verdict === 'GO'

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base via-bg-surface to-bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border-subtle sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-text-secondary" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-text-primary">XAI Result Explainer</h1>
                <p className="text-sm text-text-secondary">Assessment ID: {assessmentId}</p>
              </div>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-sevensa-teal hover:bg-sevensa-teal-dark text-white text-sm font-semibold rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* 1. Decision Summary Hero */}
        <section className={`rounded-2xl border-2 p-8 ${
          isGO
            ? 'bg-gradient-to-br from-success/5 via-success/10 to-success/5 border-success/30'
            : 'bg-gradient-to-br from-danger/5 via-danger/10 to-danger/5 border-danger/30'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                {isGO ? (
                  <div className="p-4 bg-success/20 rounded-2xl">
                    <CheckCircle2 className="w-12 h-12 text-success" />
                  </div>
                ) : (
                  <div className="p-4 bg-danger/20 rounded-2xl">
                    <XCircle className="w-12 h-12 text-danger" />
                  </div>
                )}
                <div>
                  <div className={`text-5xl font-bold mb-2 ${isGO ? 'text-success' : 'text-danger'}`}>
                    {assessment.verdict}
                  </div>
                  <div className="text-lg text-text-secondary">
                    Preferential Origin Qualification
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur rounded-xl p-6 mb-4">
                <div className="text-sm font-semibold text-text-muted mb-2">Decision Reason</div>
                <div className="text-lg text-text-primary leading-relaxed">
                  {assessment.decisionReason}
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center gap-2 text-text-muted mb-2">
                    <Brain className="w-4 h-4" />
                    <div className="text-xs font-medium">AI Confidence</div>
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {(assessment.confidence * 100).toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center gap-2 text-text-muted mb-2">
                    <Clock className="w-4 h-4" />
                    <div className="text-xs font-medium">Processing Time</div>
                  </div>
                  <div className="text-2xl font-bold text-text-primary">
                    {assessment.processingTime}s
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                  <div className="flex items-center gap-2 text-text-muted mb-2">
                    <FileText className="w-4 h-4" />
                    <div className="text-xs font-medium">Agreement</div>
                  </div>
                  <div className="text-base font-bold text-text-primary">
                    {assessment.agreement}
                  </div>
                </div>

                {assessment.savingsAmount && (
                  <div className="bg-white/80 backdrop-blur rounded-xl p-4">
                    <div className="flex items-center gap-2 text-text-muted mb-2">
                      <TrendingUp className="w-4 h-4" />
                      <div className="text-xs font-medium">Est. Savings</div>
                    </div>
                    <div className="text-2xl font-bold text-success">
                      €{(assessment.savingsAmount / 1000).toFixed(1)}K
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Rule Path Visualization */}
        <section className="bg-white rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sevensa-teal/10 rounded-lg">
              <GitBranch className="w-5 h-5 text-sevensa-teal" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Rule Path Evaluation</h2>
              <p className="text-sm text-text-secondary">Step-by-step compliance verification</p>
            </div>
          </div>

          <div className="space-y-4">
            {rulePath.map((rule, index) => (
              <div
                key={rule.id}
                className={`relative p-5 rounded-xl border-2 transition-all ${
                  rule.passed
                    ? 'bg-success/5 border-success/30 hover:shadow-md'
                    : 'bg-bg-muted border-border-subtle opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-lg ${
                      rule.passed ? 'bg-success/20' : 'bg-bg-surface'
                    }`}>
                      {rule.passed ? (
                        <CheckCircle2 className="w-6 h-6 text-success" />
                      ) : (
                        <XCircle className="w-6 h-6 text-text-muted" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">{rule.name}</h3>
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                          rule.passed ? 'bg-success text-white' : 'bg-bg-muted text-text-muted'
                        }`}>
                          {rule.type}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mb-3">{rule.description}</p>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg border border-border-subtle">
                          <div className="text-xs text-text-muted mb-1">Threshold</div>
                          <div className="text-sm font-semibold text-text-primary font-mono">{rule.threshold}</div>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-border-subtle">
                          <div className="text-xs text-text-muted mb-1">Actual</div>
                          <div className={`text-sm font-semibold font-mono ${
                            rule.passed ? 'text-success' : 'text-text-primary'
                          }`}>
                            {rule.actual}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    rule.passed ? 'text-success' : 'text-text-muted'
                  }`}>
                    {rule.passed ? '✓' : '○'}
                  </div>
                </div>

                {index < rulePath.length - 1 && (
                  <div className="absolute -bottom-4 left-[2.75rem] w-0.5 h-4 bg-border-subtle" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 3. BOM Tree & Chain Closure */}
        <section className="bg-white rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-info/10 rounded-lg">
              <Package className="w-5 h-5 text-info" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Supply Chain Coverage</h2>
              <p className="text-sm text-text-secondary">Bill of Materials with certificate status</p>
            </div>
          </div>

          <BOMTreeNode node={bomTree} level={0} />
        </section>

        {/* 4. Data Inputs */}
        <section className="bg-white rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Target className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Data Inputs</h2>
              <p className="text-sm text-text-secondary">All information used for assessment</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {dataInputs.map((input, index) => (
              <div
                key={index}
                className="p-4 bg-bg-surface rounded-lg border border-border-subtle hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs font-semibold text-text-muted">{input.category}</div>
                  {input.verified && (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  )}
                </div>
                <div className="text-sm text-text-secondary mb-1">{input.label}</div>
                <div className="text-base font-semibold text-text-primary">{input.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. AI Trace & Confidence */}
        <section className="bg-white rounded-xl border border-border-subtle p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sevensa-teal/10 rounded-lg">
              <Brain className="w-5 h-5 text-sevensa-teal" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">AI Reasoning Trace</h2>
              <p className="text-sm text-text-secondary">Step-by-step decision process with confidence scores</p>
            </div>
          </div>

          <div className="space-y-3">
            {trace.map((step, index) => (
              <div key={step.step} className="relative">
                <div className="flex items-start gap-4 p-4 bg-bg-surface rounded-lg hover:shadow-md transition-all">
                  <div className="p-2 bg-sevensa-teal/10 rounded-lg shrink-0">
                    <div className="text-sm font-bold text-sevensa-teal">{step.step}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-semibold text-text-primary mb-1">{step.action}</div>
                        <div className="text-sm text-text-secondary">{step.result}</div>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <div className="text-xs text-text-muted">Confidence</div>
                        <div className={`text-lg font-bold ${
                          step.confidence >= 0.9 ? 'text-success' :
                          step.confidence >= 0.8 ? 'text-warning' : 'text-danger'
                        }`}>
                          {(step.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted">
                      <Clock className="w-3 h-3" />
                      <span>{step.duration.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
                {index < trace.length - 1 && (
                  <div className="absolute left-6 top-full w-0.5 h-3 bg-border-subtle" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 6. Next Best Actions */}
        <section className="bg-gradient-to-br from-sevensa-teal/5 via-info/5 to-sevensa-teal/5 rounded-xl border border-sevensa-teal/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-sevensa-teal/20 rounded-lg">
              <Lightbulb className="w-5 h-5 text-sevensa-teal" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Recommended Next Steps</h2>
              <p className="text-sm text-text-secondary">Take action based on this assessment</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {nextActions.map((action) => {
              const Icon = action.icon
              const colorMap = {
                primary: 'bg-sevensa-teal hover:bg-sevensa-teal-dark text-white',
                secondary: 'bg-white hover:bg-bg-surface text-text-primary border border-border-subtle',
                info: 'bg-info/10 hover:bg-info/20 text-info border border-info/20'
              }

              return (
                <button
                  key={action.id}
                  className={`p-5 rounded-xl transition-all text-left ${colorMap[action.type]}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Icon className="w-6 h-6" />
                    <ArrowRight className="w-5 h-5" />
                  </div>
                  <div className="text-lg font-semibold mb-2">{action.title}</div>
                  <div className="text-sm opacity-90">{action.description}</div>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

// ============================================================================
// BOM TREE COMPONENT
// ============================================================================

interface BOMTreeNodeProps {
  node: BOMNode
  level: number
}

function BOMTreeNode({ node, level }: BOMTreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="space-y-2">
      <div
        className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
          level === 0
            ? 'bg-sevensa-teal/10 border-2 border-sevensa-teal/30'
            : 'bg-bg-surface border border-border-subtle hover:shadow-md'
        }`}
        style={{ marginLeft: `${level * 2}rem` }}
      >
        {hasChildren && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-white rounded transition-colors"
          >
            <ChevronRight className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        )}
        {!hasChildren && <div className="w-6" />}

        <div className="flex-1 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={`text-sm font-semibold ${level === 0 ? 'text-sevensa-teal' : 'text-text-primary'}`}>
                {node.name}
              </div>
              {node.hasCertificate && (
                <CheckCircle2 className="w-4 h-4 text-success" />
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-text-muted">
              <span className="font-mono">{node.hsCode}</span>
              <span>•</span>
              <span>Origin: {node.origin}</span>
              <span>•</span>
              <span>Value: {node.value}%</span>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            node.hasCertificate
              ? 'bg-success/10 text-success'
              : 'bg-warning/10 text-warning'
          }`}>
            {node.hasCertificate ? 'Certified' : 'Missing CoO'}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="space-y-2">
          {node.children!.map((child) => (
            <BOMTreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
