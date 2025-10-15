'use client';

import { useState, useEffect } from 'react';

type Stage = 'Qualified' | 'Won' | 'None';

export default function StageNotifier({
  opportunityId,
  partnerManagerEmail,
}: {
  opportunityId: string;
  partnerManagerEmail: string;
}) {
  const [stage, setStage] = useState<Stage>('None');
  const [notificationStatus, setNotificationStatus] = useState<string>('');

  useEffect(() => {
    const notifyPartnerManager = async () => {
      if (stage === 'None') return;

      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            stage,
            opportunityId,
            partnerManagerEmail,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to send notification');
        }

        setNotificationStatus('Notification sent successfully');
      } catch (error) {
        console.error('Notification error:', error);
        setNotificationStatus(
          error instanceof Error ? error.message : 'Failed to send notification'
        );
      }
    };

    notifyPartnerManager();
  }, [stage, opportunityId, partnerManagerEmail]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <label className="block mb-4">
        <span className="text-gray-700 font-semibold">Update Stage:</span>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as Stage)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="None">Select stage</option>
          <option value="Qualified">Qualified</option>
          <option value="Won">Won</option>
        </select>
      </label>

      {notificationStatus && (
        <div
          className={`mt-4 p-3 rounded-lg ${
            notificationStatus.includes('success')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {notificationStatus}
        </div>
      )}
    </div>
  );
}
