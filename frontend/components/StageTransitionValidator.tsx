'use client';

import { useState, useEffect } from 'react';

type Stage = 'draft' | 'review' | 'approved' | 'rejected' | 'archived';

export default function StageTransitionValidator() {
  const [currentStage, setCurrentStage] = useState<Stage>('draft');
  const [nextStage, setNextStage] = useState<Stage>('draft');
  const [userRole, setUserRole] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid?: boolean;
    message?: string;
    details?: {
      stageValidation: boolean;
      roleValidation: boolean;
    };
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const validateTransition = async () => {
      if (!currentStage || !nextStage || !userRole) return;

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          currentStage,
          nextStage,
          userRole
        });

        const response = await fetch(`/api/stage-transitions/validate?${params}`);
        
        if (!response.ok) {
          throw new Error('Validation request failed');
        }

        const data = await response.json();
        setValidationResult(data);
      } catch (error) {
        console.error('Validation error:', error);
        setValidationResult({
          message: 'Error validating transition',
          isValid: false
        });
      } finally {
        setIsLoading(false);
      }
    };

    validateTransition();
  }, [currentStage, nextStage, userRole]);

  return (
    <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Stage Transition Validator</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Current Stage:</label>
          <select
            value={currentStage}
            onChange={(e) => setCurrentStage(e.target.value as Stage)}
            className="w-full p-2 border rounded-md"
          >
            {['draft', 'review', 'approved', 'rejected', 'archived'].map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Next Stage:</label>
          <select
            value={nextStage}
            onChange={(e) => setNextStage(e.target.value as Stage)}
            className="w-full p-2 border rounded-md"
          >
            {['draft', 'review', 'approved', 'rejected', 'archived'].map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">User Role:</label>
          <input
            type="text"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter user role..."
          />
        </div>

        {isLoading ? (
          <div className="text-blue-600">Validating...</div>
        ) : validationResult.message ? (
          <div
            className={`p-3 rounded-md ${
              validationResult.isValid
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            <p className="font-medium">{validationResult.message}</p>
            {validationResult.details && (
              <div className="mt-2 text-sm">
                <p>Stage valid: {validationResult.details.stageValidation ? '✅' : '❌'}</p>
                <p>Role valid: {validationResult.details.roleValidation ? '✅' : '❌'}</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
