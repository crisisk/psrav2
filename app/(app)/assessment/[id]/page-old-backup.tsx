'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import Link from 'next/link';
import { ResultExplainer } from '@/shared/ui/xai/ResultExplainer';
import { trackEvent } from '@/shared/lib/telemetry';
import { ExportButton } from '@/shared/ui/common/ExportButton';

interface Assessment {
  id: string;
  ltsdId: string;
  hsCode: string;
  productName: string;
  verdict: 'GO' | 'NO_GO' | 'PENDING' | 'REVIEW';
  status: string;
  agreement?: string;
  confidence?: number;
  createdAt: string;
  completedAt?: string;
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const assessmentId = params.id as string;

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [showXai, setShowXai] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'csv'>('pdf');

  useEffect(() => {
    if (assessmentId) {
      trackEvent('assessment_open', { assessmentId });
      fetch(`/api/assessments`)
        .then(res => res.json())
        .then(data => {
          const found = data.find((a: Assessment) => a.id === assessmentId);
          setAssessment(found || null);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [assessmentId]);

  const verdictColor = (verdict: string) => {
    switch (verdict) {
      case 'GO': return 'bg-success/10 text-success';
      case 'NO_GO': return 'bg-error/10 text-error';
      case 'PENDING': return 'bg-warning/10 text-warning';
      case 'REVIEW': return 'bg-info/10 text-info';
      default: return 'bg-bg-muted text-text-muted';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-bg-muted rounded w-1/3"></div>
        <div className="h-64 bg-bg-muted rounded"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted">Assessment not found</p>
        <Link href="/dashboard" className="text-sevensa-teal hover:underline mt-4 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-sevensa-dark dark:text-dark-text-primary">
              Assessment Detail
            </h1>
            <p className="text-sm text-text-secondary">ID: {assessment.id.substring(0, 13)}...</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setShowXai(true);
              trackEvent('xai_open', { assessmentId: assessment.id });
            }}
            className="px-4 py-2 bg-sevensa-teal hover:bg-sevensa-teal-600 text-white font-semibold rounded-lg transition-colors flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>XAI Explainer</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'json' | 'csv')}
              className="px-2 py-1 rounded border border-border dark:border-dark-border"
            >
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            
            <ExportButton
              assessmentId={assessmentId}
              format={exportFormat}
              data={assessment}
            />
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <div className="bg-white dark:bg-dark-bg-surface rounded-xl p-6 shadow-card border border-border dark:border-dark-border">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-text-muted mb-4">Product Information</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-text-muted">Product Name</div>
                <div className="text-base font-semibold text-sevensa-dark dark:text-dark-text-primary">
                  {assessment.productName}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">HS Code</div>
                <div className="text-base font-mono text-sevensa-dark dark:text-dark-text-primary">
                  {assessment.hsCode}
                </div>
              </div>
              <div>
                <div className="text-xs text-text-muted">LTSD ID</div>
                <div className="text-base font-mono text-sevensa-dark dark:text-dark-text-primary">
                  {assessment.ltsdId.substring(0, 13)}...
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-text-muted mb-4">Decision</h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-text-muted mb-1">Verdict</div>
                <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-lg ${verdictColor(assessment.verdict)}`}>
                  {assessment.verdict}
                </span>
              </div>
              {assessment.agreement && (
                <div>
                  <div className="text-xs text-text-muted">Agreement</div>
                  <div className="text-base font-semibold text-sevensa-dark dark:text-dark-text-primary">
                    {assessment.agreement}
                  </div>
                </div>
              )}
              {assessment.confidence && (
                <div>
                  <div className="text-xs text-text-muted">Confidence</div>
                  <div className="text-base font-semibold text-sevensa-dark dark:text-dark-text-primary">
                    {(assessment.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-border dark:border-dark-border">
          <div className="flex justify-between text-xs text-text-muted">
            <div>Created: {new Date(assessment.createdAt).toLocaleString()}</div>
            {assessment.completedAt && (
              <div>Completed: {new Date(assessment.completedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>

      {/* XAI Explainer */}
      <ResultExplainer
        assessmentId={assessmentId}
        isOpen={showXai}
        onClose={() => setShowXai(false)}
      />
    </div>
  );
}