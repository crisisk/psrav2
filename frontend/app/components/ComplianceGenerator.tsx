'use client';

import { useState } from 'react';
import axios from 'axios';

type RiskLevel = 'low' | 'medium' | 'high' | 'unacceptable';

interface ComplianceContent {
  riskAssessment: string;
  complianceSteps: string[];
  requiredDocuments: string[];
}

export default function ComplianceGenerator() {
  const [prompt, setPrompt] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('low');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplianceContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/compliance/generate', {
        prompt,
        riskLevel,
      });

      if (response.data.success) {
        setResult(response.data.content);
      } else {
        setError('Failed to generate compliance content');
      }
    } catch (err) {
      setError(axios.isAxiosError(err) 
        ? err.response?.data?.error || 'Request failed'
        : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">
            System Description:
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
              rows={3}
              disabled={loading}
              required
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Risk Level:
            <select
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              className="w-full mt-1 p-2 border rounded-md"
              disabled={loading}
            >
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="unacceptable">Unacceptable Risk</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Generating...' : 'Generate Compliance Report'}
        </button>
      </form>

      {error && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">Risk Assessment</h2>
            <div className="whitespace-pre-line bg-gray-50 p-4 rounded-md">
              {result.riskAssessment}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Required Steps</h2>
            <ul className="list-disc list-inside space-y-2 bg-gray-50 p-4 rounded-md">
              {result.complianceSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Documentation Requirements</h2>
            <ul className="list-disc list-inside space-y-2 bg-gray-50 p-4 rounded-md">
              {result.requiredDocuments.map((doc, index) => (
                <li key={index}>{doc}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
