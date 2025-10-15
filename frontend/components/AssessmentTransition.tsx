'use client';
import { useState, useEffect } from 'react';
import { AssessmentStage } from '@/lib/types/assessment';

type TransitionResponse = {
  success: boolean;
  message?: string;
  error?: string;
  allowedTransitions?: AssessmentStage[];
}

export default function AssessmentTransition({
  initialStage
}: {
  initialStage: AssessmentStage
}) {
  const [currentStage, setCurrentStage] = useState(initialStage);
  const [allowedTransitions, setAllowedTransitions] = useState<AssessmentStage[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    fetchAllowedTransitions();
  }, []);

  const fetchAllowedTransitions = async () => {
    try {
      const response = await fetch('/api/assessments/transitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage, targetStage: currentStage })
      });

      const data: TransitionResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch transitions');
      }

      setAllowedTransitions(data.allowedTransitions || []);
    } catch (err) {
      console.error('Error fetching transitions:', err);
      setErrorMessage('Failed to load transition rules');
      setStatus('error');
    }
  };

  const handleTransition = async (targetStage: AssessmentStage) => {
    setStatus('loading');
    try {
      const response = await fetch('/api/assessments/transitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStage, targetStage })
      });

      const data: TransitionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transition failed');
      }

      setCurrentStage(targetStage);
      await fetchAllowedTransitions();
      setStatus('idle');
    } catch (err) {
      console.error('Transition error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Transition failed');
      setStatus('error');
    }
  };

  const getStageColor = (stage: AssessmentStage) => {
    switch (stage) {
      case AssessmentStage.INITIATION: return 'bg-blue-200';
      case AssessmentStage.PLANNING: return 'bg-purple-200';
      case AssessmentStage.EXECUTION: return 'bg-yellow-200';
      case AssessmentStage.REVIEW: return 'bg-green-200';
      case AssessmentStage.CLOSED: return 'bg-gray-200';
      default: return 'bg-white';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6 p-4 rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Current Stage: </h2>
        <span className={`${getStageColor(currentStage)} px-4 py-2 rounded-full`}>
          {currentStage}
        </span>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Allowed Transitions:</h3>
        <div className="flex flex-wrap gap-3">
          {allowedTransitions.map((stage) => (
            <button
              key={stage}
              onClick={() => handleTransition(stage)}
              disabled={status === 'loading'}
              className={`
                ${getStageColor(stage)}
                px-4 py-2 rounded-full
                hover:opacity-80
                transition-opacity
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {status === 'error' && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg">
          {errorMessage}
        </div>
      )}

      {status === 'loading' && (
        <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
          Processing transition...
        </div>
      )}
    </div>
  );
}
