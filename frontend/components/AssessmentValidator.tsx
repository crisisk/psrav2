'use client';

import { useState } from 'react';

type AssessmentSection = {
  id: string;
  name: string;
  isComplete: boolean;
};

export default function AssessmentValidator() {
  const [sections, setSections] = useState<AssessmentSection[]>([
    { id: '1', name: 'Scope Definition', isComplete: false },
    { id: '2', name: 'Risk Analysis', isComplete: false },
    { id: '3', name: 'Testing Procedures', isComplete: false },
    { id: '4', name: 'Documentation Review', isComplete: false },
    { id: '5', name: 'Compliance Check', isComplete: false },
    { id: '6', name: 'Quality Assurance', isComplete: false },
    { id: '7', name: 'Final Approval', isComplete: false },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid?: boolean;
    missingSections?: string[];
  }>({});

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/assessments/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections }),
      });

      if (!response.ok) {
        throw new Error('Validation failed');
      }

      const result = await response.json();
      setValidationResult(result);

      if (result.isValid) {
        // Proceed with submission
        console.log('Submission allowed');
      }

    } catch (err) {
      console.error('Submission error:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Assessment Sections</h2>
        {sections.map((section) => (
          <div key={section.id} className="flex items-center mb-2 p-2 bg-gray-50 rounded">
            <input
              type="checkbox"
              checked={section.isComplete}
              onChange={(e) => {
                const updated = sections.map(s =>
                  s.id === section.id ? { ...s, isComplete: e.target.checked } : s
                );
                setSections(updated);
              }}
              className="mr-3 h-4 w-4"
            />
            <span className={section.isComplete ? 'text-green-600' : 'text-gray-700'}>
              {section.name}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {validationResult.missingSections && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded">
          Missing sections: {validationResult.missingSections.join(', ')}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Validating...' : 'Submit Assessment'}
      </button>

      {validationResult.isValid && (
        <div className="mt-4 p-3 bg-green-100 text-green-700 rounded">
          All sections complete! Submission allowed.
        </div>
      )}
    </div>
  );
}
