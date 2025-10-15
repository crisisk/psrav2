'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

interface DocumentGeneratorProps {
  assessmentId: string;
}

export function DocumentGenerator({ assessmentId }: DocumentGeneratorProps) {
  const router = useRouter();
  const [format, setFormat] = useState<'PDF' | 'DOCX'>('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/document/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assessmentId, format }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const { data } = await response.json();
      setDocumentUrl(data.documentUrl);
      router.refresh();
    } catch (err) {
      console.error('Document generation failed:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Generate Report</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="PDF"
              checked={format === 'PDF'}
              onChange={(e) => setFormat(e.target.value as 'PDF' | 'DOCX')}
              className="form-radio h-4 w-4 text-blue-600"
              disabled={isGenerating}
            />
            <span className="text-gray-700">PDF</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="DOCX"
              checked={format === 'DOCX'}
              onChange={(e) => setFormat(e.target.value as 'PDF' | 'DOCX')}
              className="form-radio h-4 w-4 text-blue-600"
              disabled={isGenerating}
            />
            <span className="text-gray-700">Word Document</span>
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {documentUrl ? (
          <div className="p-3 bg-green-50 text-green-700 rounded-md">
            Document generated successfully!{' '}
            <a
              href={documentUrl}
              className="underline hover:text-green-800"
              download
            >
              Download here
            </a>
          </div>
        ) : (
          <Button
            onClick={handleGenerateDocument}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Document'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
