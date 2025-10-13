import { useState } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/shared/lib/telemetry';

interface CooUploadFormProps {
  onClose: () => void;
}

export default function CooUploadForm({ onClose }: CooUploadFormProps) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({
    supplier: '',
    product: '',
    country: '',
    hsCode: ''
  });
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
        setFile(selectedFile);
        trackEvent('coo_file_selected', { fileType: selectedFile.type });
      } else {
        toast.error('Please select a PDF or image file');
      }
    }
  };

  const handleNext = () => {
    if (step === 1 && !file) {
      toast.error('Please select a file');
      return;
    }
    if (step === 2 && (!metadata.supplier || !metadata.product || !metadata.country)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    setUploading(true);
    trackEvent('coo_upload_submit', { supplier: metadata.supplier });

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success('Certificate of Origin uploaded successfully');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-bg-surface rounded-lg p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Upload Certificate of Origin</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  s <= step
                    ? 'bg-sevensa-teal text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <CheckCircle className="h-6 w-6" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    s < step ? 'bg-sevensa-teal' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: File Selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Select File</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-sevensa-teal transition-colors cursor-pointer">
                <input
                  type="file"
                  id="file-upload"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF or Image files (Max 10MB)
                  </p>
                </label>
              </div>

              {file && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-3">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNext}
                disabled={!file}
                className="px-6 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Metadata */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Certificate Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Supplier *</label>
                  <input
                    type="text"
                    required
                    value={metadata.supplier}
                    onChange={(e) => setMetadata({ ...metadata, supplier: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Product *</label>
                  <input
                    type="text"
                    required
                    value={metadata.product}
                    onChange={(e) => setMetadata({ ...metadata, product: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Country of Origin *</label>
                  <input
                    type="text"
                    required
                    value={metadata.country}
                    onChange={(e) => setMetadata({ ...metadata, country: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">HS Code</label>
                  <input
                    type="text"
                    value={metadata.hsCode}
                    onChange={(e) => setMetadata({ ...metadata, hsCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Confirm Upload</h3>
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="font-medium">File:</span>
                  <span>{file?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Supplier:</span>
                  <span>{metadata.supplier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Product:</span>
                  <span>{metadata.product}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Country:</span>
                  <span>{metadata.country}</span>
                </div>
                {metadata.hsCode && (
                  <div className="flex justify-between">
                    <span className="font-medium">HS Code:</span>
                    <span>{metadata.hsCode}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={uploading}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 px-6 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { CooUploadForm };
