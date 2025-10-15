'use client';
import { useState } from 'react';

type ClassificationResult = {
  prediction: 'normal' | 'suspicious' | 'critical';
  confidence: number;
  probabilities: {
    normal: number;
    suspicious: number;
    critical: number;
  };
};

export default function AuditClassifierForm() {
  const [formData, setFormData] = useState({
    timestamp: new Date().toISOString(),
    userId: '',
    actionType: '',
    resource: '',
    statusCode: 200,
    ipAddress: '',
  });
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/classify-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data: ClassificationResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to classify audit log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Audit Log Classification</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">User ID</label>
          <input
            type="text"
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Action Type</label>
          <input
            type="text"
            value={formData.actionType}
            onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status Code</label>
          <input
            type="number"
            value={formData.statusCode}
            onChange={(e) => setFormData({ ...formData, statusCode: Number(e.target.value) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Classifying...' : 'Classify Log'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold mb-2">Classification Results:</h2>
          <div className={`p-3 rounded-md ${result.prediction === 'critical' ? 'bg-red-100' : result.prediction === 'suspicious' ? 'bg-yellow-100' : 'bg-green-100'}`}>
            <p className="font-medium">Prediction: <span className="capitalize">{result.prediction}</span></p>
            <p className="mt-1">Confidence: {(result.confidence * 100).toFixed(1)}%</p>
          </div>
          
          <div className="mt-4 grid grid-cols-3 gap-4">
            {Object.entries(result.probabilities).map(([label, value]) => (
              <div key={label} className="text-center p-2 bg-white rounded-md shadow">
                <div className="text-sm font-medium text-gray-600 capitalize">{label}</div>
                <div className="text-lg font-semibold">{(value * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
