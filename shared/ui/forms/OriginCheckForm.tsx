import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/shared/lib/telemetry';

interface FormData {
  productName: string;
  hsCode: string;
  description: string;
  agreement: 'EU_JAPAN' | 'CETA' | 'USMCA' | '';
  bomFile: File | null;
}

interface ValidationErrors {
  productName?: string;
  hsCode?: string;
  description?: string;
  agreement?: string;
}

const steps = ['Product Info', 'Agreement', 'BOM Upload', 'Review'];

interface OriginCheckFormProps {
  onClose?: () => void;
}

export default function OriginCheckForm({ onClose }: OriginCheckFormProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    productName: '',
    hsCode: '',
    description: '',
    agreement: '',
    bomFile: null
  });

  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 0) {
      if (!formData.productName.trim()) {
        newErrors.productName = 'Product name is required';
      }
      if (!formData.hsCode.trim()) {
        newErrors.hsCode = 'HS code is required';
      } else if (!/^\d{6,10}$/.test(formData.hsCode)) {
        newErrors.hsCode = 'Invalid HS code format (6-10 digits)';
      }
      if (!formData.description.trim()) {
        newErrors.description = 'Description is required';
      } else if (formData.description.length < 10) {
        newErrors.description = 'Description must be at least 10 characters';
      }
    }

    if (step === 1) {
      if (!formData.agreement) {
        newErrors.agreement = 'Please select a trade agreement';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
      setErrors({});
    } else {
      toast.error('Please fix the errors before continuing');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    setErrors({});
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData({ ...formData, bomFile: file });
    trackEvent('bom_file_selected', { hasFile: !!file });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(0) || !validateStep(1)) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      trackEvent('origin_check_submit', { agreement: formData.agreement });

      const formDataToSend = new FormData();
      formDataToSend.append('productName', formData.productName);
      formDataToSend.append('hsCode', formData.hsCode);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('agreement', formData.agreement);
      if (formData.bomFile) {
        formDataToSend.append('bomFile', formData.bomFile);
      }

      const res = await fetch('/api/assessments/create', {
        method: 'POST',
        body: formDataToSend
      });

      if (!res.ok) throw new Error('Failed to create assessment');

      const { id } = await res.json();
      toast.success('Assessment created successfully');
      trackEvent('origin_check_success', { assessmentId: id });
      router.push(`/assessment/${id}`);
    } catch (error) {
      console.error('Error creating assessment:', error);
      toast.error('Error creating assessment. Please try again.');
      trackEvent('origin_check_error', { error: String(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / (steps.length - 1)) * 100;

  return (
    <form onSubmit={onSubmit} className="max-w-2xl mx-auto p-6 bg-white dark:bg-dark-bg-surface rounded-lg shadow-sm">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`text-xs font-medium ${
                index <= currentStep
                  ? 'text-sevensa-teal'
                  : 'text-gray-400'
              }`}
            >
              {step}
            </div>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-sevensa-teal h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        {/* Step 0: Product Info */}
        {currentStep === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal ${
                  errors.productName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.productName && (
                <p className="mt-1 text-sm text-red-600">{errors.productName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                HS Code *
              </label>
              <input
                type="text"
                value={formData.hsCode}
                onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal ${
                  errors.hsCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter 6-10 digit HS code"
              />
              {errors.hsCode && (
                <p className="mt-1 text-sm text-red-600">{errors.hsCode}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter product description (minimum 10 characters)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </>
        )}

        {/* Step 1: Agreement */}
        {currentStep === 1 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Trade Agreement *
            </label>
            <select
              value={formData.agreement}
              onChange={(e) => setFormData({ ...formData, agreement: e.target.value as FormData['agreement'] })}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal ${
                errors.agreement ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a trade agreement</option>
              <option value="EU_JAPAN">EU-Japan EPA</option>
              <option value="CETA">CETA (Canada-EU)</option>
              <option value="USMCA">USMCA (US-Mexico-Canada)</option>
            </select>
            {errors.agreement && (
              <p className="mt-1 text-sm text-red-600">{errors.agreement}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Select the trade agreement that applies to your product
            </p>
          </div>
        )}

        {/* Step 2: BOM Upload */}
        {currentStep === 2 && (
          <div>
            <label className="block text-sm font-medium mb-2">
              BOM File (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sevensa-teal transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="bom-file"
              />
              <label htmlFor="bom-file" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="text-gray-600">
                    {formData.bomFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium">{formData.bomFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium">Click to upload BOM file</p>
                        <p className="text-sm text-gray-500">CSV or Excel format</p>
                      </>
                    )}
                  </div>
                </div>
              </label>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Upload your Bill of Materials for detailed origin analysis
            </p>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="border border-gray-200 rounded-lg p-6 space-y-4 bg-gray-50 dark:bg-dark-bg-base">
            <h3 className="font-semibold text-lg mb-4">Review Information</h3>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-600">Product Name:</span>
                <span className="font-medium">{formData.productName}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-600">HS Code:</span>
                <span className="font-medium font-mono">{formData.hsCode}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-600">Trade Agreement:</span>
                <span className="font-medium">
                  {formData.agreement === 'EU_JAPAN' && 'EU-Japan EPA'}
                  {formData.agreement === 'CETA' && 'CETA (Canada-EU)'}
                  {formData.agreement === 'USMCA' && 'USMCA'}
                </span>
              </div>

              <div className="py-2 border-b border-gray-200">
                <span className="font-medium text-gray-600 block mb-2">Description:</span>
                <p className="text-sm">{formData.description}</p>
              </div>

              <div className="flex justify-between py-2">
                <span className="font-medium text-gray-600">BOM File:</span>
                <span className="text-sm">{formData.bomFile?.name || 'None uploaded'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center gap-2 px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <ArrowLeft className="h-5 w-5" />
          Previous
        </button>

        {currentStep === steps.length - 1 ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            <CheckCircle className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            className="flex items-center gap-2 px-6 py-2.5 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors font-medium"
          >
            Next
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </form>
  );
}

export { OriginCheckForm };
