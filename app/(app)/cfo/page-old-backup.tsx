'use client';

import { useState } from 'react';
import { KpiStrip } from '@/shared/ui/cfo/KpiStrip';
import { Trends } from '@/shared/ui/cfo/Trends';
import { RiskTable } from '@/shared/ui/cfo/RiskTable';
import { ApprovalsTable } from '@/shared/ui/cfo/ApprovalsTable';
import { ApprovalModal } from '@/shared/ui/common/ApprovalModal';
import { Approval } from '@/shared/types';

export default function CFOPage() {
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  const handleApprove = async () => {
    if (!selectedApproval) return;
    
    try {
      await fetch(`/api/approvals/${selectedApproval.id}/approve`, {
        method: 'POST',
      });
      setSelectedApproval(null);
      // Trigger refetch of approvals data
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;

    try {
      await fetch(`/api/approvals/${selectedApproval.id}/reject`, {
        method: 'POST',
      });
      setSelectedApproval(null);
      // Trigger refetch of approvals data
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-sevensa-teal to-sevensa-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">CFO Dashboard 📊</h1>
        <p className="text-white/90 text-lg">
          Zie savings, risico's en approvals in één oogopslag. Data-driven beslissingen met realtime insights.
        </p>
      </div>

      <KpiStrip />
      <Trends />

      <div className="grid md:grid-cols-2 gap-6">
        <RiskTable />
        <ApprovalsTable onApprovalClick={setSelectedApproval} />
      </div>

      {selectedApproval && (
        <ApprovalModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}