'use client';

import { useState } from 'react';

type RiskLevel = 'high' | 'medium' | 'low';

interface ValidationResult {
  compliant: boolean;
  missingRequirements: string[];
  details: string;
}

export default function ValidationForm() {
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('high');
  const [hasRiskAssessment, setHasRiskAssessment] = useState(false);
  const [documentationExists, setDocumentationExists] = useState(false);
  const [transparencyMeasures, setTransparencyMeasures] = useState(false);
  const [humanOversight, setHumanOversight] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riskLevel,
          hasRiskAssessment,
          documentationExists,
          transparencyMeasures,
          humanOversight,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: ValidationResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Validation failed:', err);
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">EU AI Act Article 11 Compliance Check</h2>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Risk Level:
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="ml-2 p-2 border rounded w-full mt-1"
              required
            >
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
          </label>
        </div>

        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hasRiskAssessment}
              onChange={(e) => setHasRiskAssessment(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-gray-700">Risk Assessment Conducted</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={documentationExists}
              onChange={(e) => setDocumentationExists(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-gray-700">Documentation Available</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={transparencyMeasures}
              onChange={(e) => setTransparencyMeasures(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-gray-700">Transparency Measures Implemented</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={humanOversight}
              onChange={(e) => setHumanOversight(e.target.checked)}
              className="form-checkbox"
            />
            <span className="text-gray-700">Human Oversight Mechanism</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Validating...' : 'Check Compliance'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            Error: {error}
          </div>
        )}

        {result && (
          <div className={`mt-4 p-4 rounded ${result.compliant ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            <h3 className="font-bold text-lg mb-2">{result.compliant ? '✅ Compliant' : '⚠️ Not Compliant'}</h3>
            <p>{result.details}</p>
            {result.missingRequirements.length > 0 && (
              <ul className="list-disc pl-5 mt-2">
                {result.missingRequirements.map((req) => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
