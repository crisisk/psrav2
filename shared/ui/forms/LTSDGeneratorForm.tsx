import { useState } from 'react';
import { Download, Eye, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/shared/lib/telemetry';

interface LTSDFormData {
  assessments: string[];
  validFrom: string;
  validTo: string;
  supplierName: string;
  supplierAddress: string;
}

const assessmentOptions = [
  { label: 'Safety Assessment', value: 'safety' },
  { label: 'Technical Assessment', value: 'technical' },
  { label: 'Quality Assessment', value: 'quality' },
  { label: 'Environmental Assessment', value: 'environmental' }
];

interface LTSDGeneratorFormProps {
  onClose?: () => void;
}

export const LTSDGeneratorForm = ({ onClose }: LTSDGeneratorFormProps = {}) => {
  const [formData, setFormData] = useState<LTSDFormData>({
    assessments: [],
    validFrom: '',
    validTo: '',
    supplierName: '',
    supplierAddress: ''
  });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const isChainComplete = (assessments: string[]) => {
    const required = ['safety', 'technical', 'quality'];
    return required.every(assessment => assessments.includes(assessment));
  };

  const handleCheckboxChange = (value: string) => {
    const current = formData.assessments;
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    setFormData({ ...formData, assessments: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assessments.length) {
      toast.error('Please select at least one assessment');
      return;
    }

    if (!isChainComplete(formData.assessments)) {
      toast.error('Safety, Technical and Quality assessments are required');
      return;
    }

    if (!formData.validFrom || !formData.validTo) {
      toast.error('Please select validity dates');
      return;
    }

    if (!formData.supplierName || !formData.supplierAddress) {
      toast.error('Please fill in supplier information');
      return;
    }

    try {
      setLoading(true);
      trackEvent('ltsd_generate_start', { assessments: formData.assessments });

      const response = await fetch('/api/ltsd/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to generate certificate');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setPdfUrl(url);
      toast.success('Certificate generated successfully');
      trackEvent('ltsd_generate_success', { assessments: formData.assessments });
    } catch (error) {
      console.error('Certificate generation failed:', error);
      toast.error('Failed to generate certificate. Please try again.');
      trackEvent('ltsd_generate_error', { error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    link.setAttribute('download', `LTSD_Certificate_${today}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    trackEvent('ltsd_download', { date: today });
  };

  const chainIsIncomplete = formData.assessments.length > 0 && !isChainComplete(formData.assessments);

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-dark-bg-surface rounded-lg shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary mb-2">
          LTSD Certificate Generator
        </h2>
        <p className="text-sm text-text-muted dark:text-dark-text-muted">
          Generate Long-Term Supplier Declaration certificates for your approved assessments
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Assessments */}
        <div>
          <label className="block text-sm font-medium mb-3">
            Select Assessments *
          </label>
          <div className="space-y-2">
            {assessmentOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-dark-bg-base rounded transition-colors">
                <input
                  type="checkbox"
                  checked={formData.assessments.includes(option.value)}
                  onChange={() => handleCheckboxChange(option.value)}
                  className="h-4 w-4 text-sevensa-teal border-gray-300 rounded focus:ring-2 focus:ring-sevensa-teal"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>

          {chainIsIncomplete && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Safety, Technical and Quality assessments are required for certificate generation
              </p>
            </div>
          )}
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Valid From *
            </label>
            <input
              type="date"
              required
              value={formData.validFrom}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Valid To *
            </label>
            <input
              type="date"
              required
              value={formData.validTo}
              onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            />
          </div>
        </div>

        {/* Supplier Information */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Supplier Name *
          </label>
          <input
            type="text"
            required
            value={formData.supplierName}
            onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            placeholder="Enter supplier name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Supplier Address *
          </label>
          <textarea
            required
            value={formData.supplierAddress}
            onChange={(e) => setFormData({ ...formData, supplierAddress: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            placeholder="Enter supplier address"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !isChainComplete(formData.assessments)}
            className="flex items-center gap-2 px-6 py-2.5 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <FileText className="h-5 w-5" />
            {loading ? 'Generating...' : 'Generate Certificate'}
          </button>

          {pdfUrl && (
            <>
              <button
                type="button"
                onClick={() => setPreviewVisible(!previewVisible)}
                className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Eye className="h-5 w-5" />
                {previewVisible ? 'Hide Preview' : 'Preview'}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <Download className="h-5 w-5" />
                Download
              </button>
            </>
          )}
        </div>
      </form>

      {/* PDF Preview */}
      {previewVisible && pdfUrl && (
        <div className="mt-6 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-dark-bg-base px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium">Certificate Preview</p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-dark-bg-base">
            <iframe
              src={pdfUrl}
              className="w-full h-96 border-0 rounded"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LTSDGeneratorForm;
