import React, { useState, useEffect } from 'react';
import { Clipboard, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/shared/lib/telemetry';
import { toast } from 'sonner';

type Verdict = 'GO' | 'NO_GO' | 'PENDING';

interface Checkpoint {
  id: string;
  name: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  rationale: string;
}

interface BomNode {
  id: string;
  name: string;
  children?: BomNode[];
  isMissing?: boolean;
}

interface XaiResult {
  verdict: Verdict;
  summary: string;
  agreement: {
    name: string;
    ruleType: 'CTH' | 'CTSH' | 'VA' | 'WO' | 'CC';
  };
  rulePath: {
    checkpoints: Checkpoint[];
  };
  chainClosure: {
    coverage: number;
    bomTree: BomNode;
    missingNodes: string[];
  };
  inputs: {
    hsCode: string;
    bomNodesCount: number;
    documentsCount: number;
  };
  trace: {
    id: string;
    durationMs: number;
    confidence?: number;
  };
}

interface ResultExplainerProps {
  assessmentId: string;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'slide-over' | 'full';
}

export function ResultExplainer({
  assessmentId,
  isOpen,
  onClose,
  mode = 'slide-over'
}: ResultExplainerProps) {
  const [data, setData] = useState<XaiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  useEffect(() => {
    if (isOpen && assessmentId) {
      fetchXaiData();
    }
  }, [assessmentId, isOpen]);

  const fetchXaiData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assessments/${assessmentId}/xai`);
      const result = await response.json();
      setData(result);
      trackEvent('xai_open', { assessmentId });
    } catch (error) {
      console.error('Failed to fetch XAI data:', error);
      toast.error('Failed to load explainability data');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
    trackEvent('xai_section_expand', { section, expanded: !expandedSections.has(section) });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
    trackEvent('xai_copy', { type: 'audit' });
  };

  const renderVerdictBadge = (verdict: Verdict) => {
    const variants = {
      GO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      NO_GO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };

    return (
      <span className={cn('px-3 py-1 rounded-full text-sm font-medium', variants[verdict])}>
        {verdict === 'GO' ? '✓ QUALIFYING' : verdict === 'NO_GO' ? '✗ NON-QUALIFYING' : '⏱ PENDING'}
      </span>
    );
  };

  const renderCheckpointStatus = (status: Checkpoint['status']) => {
    const config = {
      PASS: { icon: <CheckCircle className="h-5 w-5" />, color: 'text-green-500' },
      WARN: { icon: <AlertTriangle className="h-5 w-5" />, color: 'text-yellow-500' },
      FAIL: { icon: <XCircle className="h-5 w-5" />, color: 'text-red-500' }
    };
    const { icon, color } = config[status];
    return <div className={color}>{icon}</div>;
  };

  const renderBomTree = (node: BomNode, level = 0) => {
    return (
      <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700" style={{ marginLeft: `${level * 16}px` }}>
        <div className={cn(
          "flex items-center gap-2 py-1",
          node.isMissing && "text-red-500 dark:text-red-400"
        )}>
          <span className="text-sm">{node.name}</span>
          {node.isMissing && (
            <span className="text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded">
              Missing
            </span>
          )}
        </div>
        {node.children?.map(child => (
          <div key={child.id} className="mt-1">
            {renderBomTree(child, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-end z-50">
      <div className={cn(
        "bg-white dark:bg-dark-bg-surface h-full overflow-y-auto shadow-2xl",
        mode === 'slide-over' ? 'w-full lg:w-2/3' : 'w-full'
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-dark-bg-surface border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold">Explainable AI - Decision Breakdown</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-dark-bg-base rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sevensa-teal" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* Decision Summary */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('summary')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-bg-base transition-colors"
                >
                  <h3 className="text-lg font-semibold">Decision Summary</h3>
                  {expandedSections.has('summary') ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {expandedSections.has('summary') && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <div>{renderVerdictBadge(data.verdict)}</div>
                    <p className="text-gray-700 dark:text-gray-300">{data.summary}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">Agreement:</span>
                      <span>{data.agreement.name}</span>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs font-mono">
                        {data.agreement.ruleType}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rule Path */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('rulePath')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-bg-base transition-colors"
                >
                  <h3 className="text-lg font-semibold">Rule Path</h3>
                  {expandedSections.has('rulePath') ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {expandedSections.has('rulePath') && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    {data.rulePath.checkpoints.map(checkpoint => (
                      <div key={checkpoint.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-dark-bg-base rounded-lg">
                        {renderCheckpointStatus(checkpoint.status)}
                        <div className="flex-1">
                          <div className="font-medium">{checkpoint.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{checkpoint.rationale}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chain Closure */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('chainClosure')}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-bg-base transition-colors"
                >
                  <h3 className="text-lg font-semibold">Chain Closure</h3>
                  {expandedSections.has('chainClosure') ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
                {expandedSections.has('chainClosure') && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Coverage</span>
                        <span className="text-gray-600 dark:text-gray-400">{data.chainClosure.coverage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={cn(
                            "h-2.5 rounded-full transition-all",
                            data.chainClosure.coverage >= 90 ? 'bg-green-500' :
                            data.chainClosure.coverage >= 70 ? 'bg-yellow-500' :
                            'bg-red-500'
                          )}
                          style={{ width: `${data.chainClosure.coverage}%` }}
                        />
                      </div>
                    </div>

                    {/* BOM Tree */}
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">BOM Tree</h4>
                      <div className="bg-gray-50 dark:bg-dark-bg-base p-4 rounded-lg">
                        {renderBomTree(data.chainClosure.bomTree)}
                      </div>
                    </div>

                    {data.chainClosure.missingNodes.length > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-2">
                          <AlertTriangle className="h-5 w-5" />
                          Missing Nodes ({data.chainClosure.missingNodes.length})
                        </div>
                        <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-400">
                          {data.chainClosure.missingNodes.map((node, idx) => (
                            <li key={idx}>{node}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => toast.info('CoO request feature coming soon')}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-base transition-colors font-medium"
                >
                  Vraag CoO aan
                </button>
                <button
                  onClick={() => toast.info('HS Wizard coming soon')}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-base transition-colors font-medium"
                >
                  Open HS Wizard
                </button>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors font-medium"
                >
                  <Clipboard className="h-5 w-5" />
                  Export Audit Pack
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No explainability data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResultExplainer;
