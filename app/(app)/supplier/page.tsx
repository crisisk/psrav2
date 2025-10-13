/**
 * Supplier Portal - Production Redesign
 * /supplier
 *
 * x100 Design Quality:
 * - Active supply chains with coverage tracking
 * - 4-step CoO upload wizard
 * - Submissions history with status
 * - Sevensa brand identity
 */

'use client'

import { useState } from 'react'
import {
  Package,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  FileText,
  TrendingUp,
  X,
  Check,
  Eye
} from 'lucide-react'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SupplyChain {
  id: string
  ltsdId: string
  productName: string
  rootHs: string
  agreement: string
  status: 'active' | 'pending_closure' | 'complete'
  coveragePct: number
  totalNodes: number
  uploadedNodes: number
  missingNodes: number
  dueDate: string
}

interface CoOSubmission {
  id: string
  ltsdId: string
  productName: string
  nodeId: string
  nodeName: string
  uploadedAt: string
  status: 'pending' | 'approved' | 'rejected' | 'review'
  reviewedBy?: string
  feedback?: string
}

interface WizardStep {
  number: number
  title: string
  description: string
  completed: boolean
}

// ============================================================================
// MOCK DATA (Replace with API calls)
// ============================================================================

const MOCK_CHAINS: SupplyChain[] = [
  {
    id: 'chain-1',
    ltsdId: 'LTSD-2025-001',
    productName: 'Automotive Electronic Module XK-2400',
    rootHs: '8537.10.99',
    agreement: 'EU-Vietnam FTA',
    status: 'active',
    coveragePct: 87,
    totalNodes: 15,
    uploadedNodes: 13,
    missingNodes: 2,
    dueDate: '2025-10-20'
  },
  {
    id: 'chain-2',
    ltsdId: 'LTSD-2025-003',
    productName: 'Steel Component Assembly',
    rootHs: '7326.19.00',
    agreement: 'CETA',
    status: 'active',
    coveragePct: 60,
    totalNodes: 10,
    uploadedNodes: 6,
    missingNodes: 4,
    dueDate: '2025-10-25'
  },
  {
    id: 'chain-3',
    ltsdId: 'LTSD-2025-005',
    productName: 'Textile Material Roll',
    rootHs: '5407.61.00',
    agreement: 'EU-South Korea FTA',
    status: 'pending_closure',
    coveragePct: 95,
    totalNodes: 20,
    uploadedNodes: 19,
    missingNodes: 1,
    dueDate: '2025-10-18'
  },
  {
    id: 'chain-4',
    ltsdId: 'LTSD-2025-007',
    productName: 'Copper Wire Assembly',
    rootHs: '8544.42.90',
    agreement: 'EFTA',
    status: 'complete',
    coveragePct: 100,
    totalNodes: 8,
    uploadedNodes: 8,
    missingNodes: 0,
    dueDate: '2025-10-15'
  }
]

const MOCK_SUBMISSIONS: CoOSubmission[] = [
  {
    id: 'sub-1',
    ltsdId: 'LTSD-2025-001',
    productName: 'Automotive Electronic Module XK-2400',
    nodeId: 'node-12',
    nodeName: 'PCB Assembly',
    uploadedAt: '2025-10-13T09:30:00Z',
    status: 'pending',
  },
  {
    id: 'sub-2',
    ltsdId: 'LTSD-2025-003',
    productName: 'Steel Component Assembly',
    nodeId: 'node-5',
    nodeName: 'Steel Plate',
    uploadedAt: '2025-10-12T14:20:00Z',
    status: 'approved',
    reviewedBy: 'Suus van der Berg',
  },
  {
    id: 'sub-3',
    ltsdId: 'LTSD-2025-001',
    productName: 'Automotive Electronic Module XK-2400',
    nodeId: 'node-8',
    nodeName: 'Capacitor Array',
    uploadedAt: '2025-10-11T11:15:00Z',
    status: 'review',
  },
  {
    id: 'sub-4',
    ltsdId: 'LTSD-2025-005',
    productName: 'Textile Material Roll',
    nodeId: 'node-3',
    nodeName: 'Polyester Thread',
    uploadedAt: '2025-10-10T16:45:00Z',
    status: 'approved',
    reviewedBy: 'Suus van der Berg',
  },
  {
    id: 'sub-5',
    ltsdId: 'LTSD-2025-003',
    productName: 'Steel Component Assembly',
    nodeId: 'node-2',
    nodeName: 'Bolt Package',
    uploadedAt: '2025-10-09T10:00:00Z',
    status: 'rejected',
    reviewedBy: 'Compliance Team',
    feedback: 'Document expired, please upload valid CoO'
  }
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SupplierPage() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedChain, setSelectedChain] = useState<SupplyChain | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  const handleStartUpload = (chain: SupplyChain) => {
    setSelectedChain(chain)
    setCurrentStep(1)
    setWizardOpen(true)
  }

  const activeChains = MOCK_CHAINS.filter(c => c.status === 'active' || c.status === 'pending_closure')
  const completedChains = MOCK_CHAINS.filter(c => c.status === 'complete')

  // Calculate summary stats
  const totalCoverage = Math.round(
    MOCK_CHAINS.reduce((sum, c) => sum + c.coveragePct, 0) / MOCK_CHAINS.length
  )
  const pendingUploads = MOCK_CHAINS.reduce((sum, c) => sum + c.missingNodes, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg-base via-bg-surface to-bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Supplier Portal
              </h1>
              <p className="text-text-secondary">
                Upload Certificates of Origin and track supply chain completion
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-info">{totalCoverage}%</div>
                <div className="text-xs text-text-muted">Avg Coverage</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Summary Stats */}
        <section className="grid md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-info/10 rounded-lg">
                <Package className="w-5 h-5 text-info" />
              </div>
              <div className="text-sm font-medium text-text-muted">Active Chains</div>
            </div>
            <div className="text-3xl font-bold text-text-primary">{activeChains.length}</div>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <div className="text-sm font-medium text-text-muted">Pending Uploads</div>
            </div>
            <div className="text-3xl font-bold text-text-primary">{pendingUploads}</div>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div className="text-sm font-medium text-text-muted">Completed</div>
            </div>
            <div className="text-3xl font-bold text-text-primary">{completedChains.length}</div>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-sevensa-teal/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-sevensa-teal" />
              </div>
              <div className="text-sm font-medium text-text-muted">Avg Coverage</div>
            </div>
            <div className="text-3xl font-bold text-text-primary">{totalCoverage}%</div>
          </div>
        </section>

        {/* Active Supply Chains */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Active Supply Chains</h2>
            <span className="px-3 py-1 bg-info/10 text-info rounded-full text-sm font-medium">
              {activeChains.length} active
            </span>
          </div>

          <div className="space-y-4">
            {activeChains.map((chain) => {
              const statusColors = {
                active: 'bg-info/10 text-info border-info/20',
                pending_closure: 'bg-warning/10 text-warning border-warning/20',
                complete: 'bg-success/10 text-success border-success/20'
              }

              const statusLabels = {
                active: 'Active',
                pending_closure: 'Pending Closure',
                complete: 'Complete'
              }

              return (
                <div
                  key={chain.id}
                  className="bg-white rounded-xl border border-border-subtle p-6 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-text-primary">
                          {chain.productName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[chain.status]}`}>
                          {statusLabels[chain.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="font-mono">{chain.ltsdId}</span>
                        <span>•</span>
                        <span>HS: {chain.rootHs}</span>
                        <span>•</span>
                        <span>{chain.agreement}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Due {new Date(chain.dueDate).toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    {chain.missingNodes > 0 && (
                      <button
                        onClick={() => handleStartUpload(chain)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-sevensa-teal hover:bg-sevensa-teal-dark text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Upload CoO
                      </button>
                    )}
                  </div>

                  {/* Coverage Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted">Chain Coverage</span>
                      <span className="font-semibold text-text-primary">
                        {chain.uploadedNodes}/{chain.totalNodes} nodes ({chain.coveragePct}%)
                      </span>
                    </div>
                    <div className="w-full bg-bg-muted rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-sevensa-teal to-info rounded-full h-3 transition-all duration-500"
                        style={{ width: `${chain.coveragePct}%` }}
                      />
                    </div>
                    {chain.missingNodes > 0 && (
                      <div className="flex items-center gap-2 text-sm text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{chain.missingNodes} missing node{chain.missingNodes > 1 ? 's' : ''} - upload required</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Submissions History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-text-primary">Recent Submissions</h2>
            <span className="px-3 py-1 bg-sevensa-teal/10 text-sevensa-teal rounded-full text-sm font-medium">
              {MOCK_SUBMISSIONS.length} total
            </span>
          </div>

          <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
            <table className="w-full">
              <thead className="bg-bg-muted border-b border-border-subtle">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">LTSD</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Product</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Node</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-text-primary">Reviewed By</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {MOCK_SUBMISSIONS.map((submission) => {
                  const statusConfig = {
                    pending: { label: 'Pending', color: 'bg-warning/10 text-warning', icon: Clock },
                    approved: { label: 'Approved', color: 'bg-success/10 text-success', icon: CheckCircle2 },
                    rejected: { label: 'Rejected', color: 'bg-danger/10 text-danger', icon: X },
                    review: { label: 'In Review', color: 'bg-info/10 text-info', icon: FileText }
                  }

                  const config = statusConfig[submission.status]
                  const StatusIcon = config.icon

                  return (
                    <tr key={submission.id} className="hover:bg-bg-surface transition-colors">
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {new Date(submission.uploadedAt).toLocaleDateString('nl-NL', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-text-secondary">
                        {submission.ltsdId}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-text-primary">
                        {submission.productName}
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {submission.nodeName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {submission.reviewedBy || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-bg-surface rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-text-muted" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* CoO Upload Wizard Modal */}
      {wizardOpen && selectedChain && (
        <CoOWizardModal
          chain={selectedChain}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onClose={() => {
            setWizardOpen(false)
            setSelectedChain(null)
            setCurrentStep(1)
          }}
        />
      )}
    </div>
  )
}

// ============================================================================
// COO WIZARD MODAL COMPONENT
// ============================================================================

interface CoOWizardModalProps {
  chain: SupplyChain
  currentStep: number
  onStepChange: (step: number) => void
  onClose: () => void
}

function CoOWizardModal({ chain, currentStep, onStepChange, onClose }: CoOWizardModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const steps: WizardStep[] = [
    { number: 1, title: 'Select Node', description: 'Choose BOM node for CoO upload', completed: currentStep > 1 },
    { number: 2, title: 'Upload Document', description: 'Upload Certificate of Origin PDF', completed: currentStep > 2 },
    { number: 3, title: 'Verify Details', description: 'Confirm origin country and HS code', completed: currentStep > 3 },
    { number: 4, title: 'Submit', description: 'Final review and submission', completed: currentStep > 4 }
  ]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleNext = () => {
    if (currentStep < 4) {
      onStepChange(currentStep + 1)
    } else {
      // Submit logic here
      onClose()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border-subtle p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Upload Certificate of Origin</h2>
            <p className="text-sm text-text-secondary mt-1">
              {chain.productName} • {chain.ltsdId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-surface rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-muted" />
          </button>
        </div>

        {/* Steps Progress */}
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step.completed
                        ? 'bg-success text-white'
                        : currentStep === step.number
                        ? 'bg-sevensa-teal text-white'
                        : 'bg-bg-muted text-text-muted'
                    }`}
                  >
                    {step.completed ? <Check className="w-5 h-5" /> : step.number}
                  </div>
                  <div className="hidden md:block">
                    <div className={`text-sm font-semibold ${
                      currentStep === step.number ? 'text-text-primary' : 'text-text-muted'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-text-muted">{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    step.completed ? 'bg-success' : 'bg-bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6 min-h-[300px]">
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-text-secondary">Select the BOM node you want to upload a Certificate of Origin for:</p>
              <div className="space-y-2">
                <div className="p-4 border border-border-subtle rounded-lg hover:border-sevensa-teal cursor-pointer transition-colors">
                  <div className="font-medium text-text-primary">Node 1: PCB Assembly</div>
                  <div className="text-sm text-text-muted">HS: 8534.00.00 • Missing CoO</div>
                </div>
                <div className="p-4 border border-border-subtle rounded-lg hover:border-sevensa-teal cursor-pointer transition-colors">
                  <div className="font-medium text-text-primary">Node 2: Connector Set</div>
                  <div className="text-sm text-text-muted">HS: 8536.69.00 • Missing CoO</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-text-secondary">Upload the Certificate of Origin document (PDF format):</p>
              <div className="border-2 border-dashed border-border-subtle rounded-lg p-8 text-center hover:border-sevensa-teal transition-colors">
                <Upload className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-sevensa-teal font-semibold mb-2">Click to upload</div>
                  <div className="text-sm text-text-muted">or drag and drop</div>
                  <div className="text-xs text-text-muted mt-2">PDF up to 10MB</div>
                </label>
                {selectedFile && (
                  <div className="mt-4 p-3 bg-success/10 rounded-lg">
                    <div className="text-sm font-medium text-success">✓ {selectedFile.name}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <p className="text-text-secondary">Verify the details extracted from the certificate:</p>
              <div className="space-y-3">
                <div className="p-4 bg-bg-surface rounded-lg">
                  <div className="text-sm text-text-muted mb-1">Country of Origin</div>
                  <div className="text-lg font-semibold text-text-primary">Vietnam</div>
                </div>
                <div className="p-4 bg-bg-surface rounded-lg">
                  <div className="text-sm text-text-muted mb-1">HS Code</div>
                  <div className="text-lg font-semibold text-text-primary font-mono">8534.00.00</div>
                </div>
                <div className="p-4 bg-bg-surface rounded-lg">
                  <div className="text-sm text-text-muted mb-1">Issue Date</div>
                  <div className="text-lg font-semibold text-text-primary">12 Oct 2025</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-info mt-0.5" />
                  <div>
                    <div className="font-semibold text-text-primary mb-1">Ready to Submit</div>
                    <div className="text-sm text-text-secondary">
                      Your Certificate of Origin will be submitted for compliance review.
                      You'll receive a notification once it's been approved.
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-bg-surface rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Chain:</span>
                  <span className="font-medium text-text-primary">{chain.ltsdId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Node:</span>
                  <span className="font-medium text-text-primary">PCB Assembly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Document:</span>
                  <span className="font-medium text-text-primary">{selectedFile?.name || 'coo_document.pdf'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-border-subtle p-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-2 bg-sevensa-teal hover:bg-sevensa-teal-dark text-white font-semibold rounded-lg transition-colors"
          >
            {currentStep === 4 ? 'Submit' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
