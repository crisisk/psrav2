'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface DocumentationStatus {
  exists: boolean;
  loading: boolean;
  error?: string;
}

interface Props {
  assessmentId: string;
  onValidated: () => void;
}

export function DocumentationPrerequisite({ assessmentId, onValidated }: Props) {
  const [status, setStatus] = useState<DocumentationStatus>({
    exists: false,
    loading: true
  });

  useEffect(() => {
    const checkDocumentation = async () => {
      try {
        const response = await fetch(
          `/api/documentation/check?assessmentId=${encodeURIComponent(assessmentId)}`
        );

        if (!response.ok) {
          throw new Error('Failed to verify documentation');
        }

        const data = await response.json();

        if (data.success && data.exists) {
          onValidated();
        }

        setStatus({
          exists: data.exists,
          loading: false,
          error: data.message
        });

      } catch (err) {
        console.error('Documentation check failed:', err);
        setStatus({
          exists: false,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    };

    checkDocumentation();
  }, [assessmentId, onValidated]);

  if (status.loading) {
    return (
      <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
        <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
        <span className="text-blue-800">Verifying technical documentation...</span>
      </div>
    );
  }

  if (status.error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <h3 className="text-red-600 font-semibold mb-2">Verification Error</h3>
        <p className="text-red-700">{status.error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-green-50 rounded-lg">
      {status.exists ? (
        <div className="text-green-700">
          ✅ Technical documentation verified - Conformity assessment can proceed
        </div>
      ) : (
        <div className="text-amber-700">
          ⚠️ Missing technical documentation - Upload required documents first
        </div>
      )}
    </div>
  );
}
