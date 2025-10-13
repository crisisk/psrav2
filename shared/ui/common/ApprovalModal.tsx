import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { trackEvent } from '@/shared/lib/telemetry';
import { Approval } from '@/shared/types';

interface Props {
  approval: Approval;
  onApprove: (id: string, note: string) => Promise<void>;
  onReject: (id: string, note: string) => Promise<void>;
  onClose: () => void;
}

export const ApprovalModal = ({ approval, onApprove, onReject, onClose }: Props) => {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    trackEvent('approval_action', { action: 'approve', id: approval.id });
    try {
      await onApprove(approval.id, note);
      onClose();
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    trackEvent('approval_action', { action: 'reject', id: approval.id });
    try {
      await onReject(approval.id, note);
      onClose();
    } catch (error) {
      console.error('Rejection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-bg-surface rounded-lg p-6 w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Approval Request</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Supplier</label>
            <p className="text-gray-900">{approval.supplier}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Product</label>
            <p className="text-gray-900">{approval.productName}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Value</label>
            <p className="text-gray-900">€{approval.value.toLocaleString()}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <p className="text-gray-900">{approval.status}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Requested By</label>
            <p className="text-gray-900">{approval.requestedBy}</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add notes (optional)"
              className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <XCircle className="h-5 w-5" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircle className="h-5 w-5" />
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
