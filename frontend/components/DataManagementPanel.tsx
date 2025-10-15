'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function DataManagementPanel() {
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBackup = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupType: 'full' }),
      });

      if (!response.ok) throw new Error('Backup failed');
      
      const data = await response.json();
      setBackupStatus(`Backup created: ${data.id} (${data.size})`);
    } catch (error) {
      console.error(error);
      setBackupStatus('Backup failed - check console for details');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMigration = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'legacy-db',
          destination: 'new-cluster',
        }),
      });

      if (!response.ok) throw new Error('Migration failed');
      
      const data = await response.json();
      setMigrationStatus(`Migrated ${data.recordsProcessed} records`);
    } catch (error) {
      console.error(error);
      setMigrationStatus('Migration failed - check console for details');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Data Management</h2>
      
      <div className="space-y-4">
        <div className="border p-4 rounded-md">
          <h3 className="font-medium mb-2">Backup Operations</h3>
          <Button 
            onClick={handleBackup}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? 'Creating Backup...' : 'Start Full Backup'}
          </Button>
          {backupStatus && (
            <p className="mt-2 text-sm text-green-600">{backupStatus}</p>
          )}
        </div>

        <div className="border p-4 rounded-md">
          <h3 className="font-medium mb-2">Data Migration</h3>
          <Button
            onClick={handleMigration}
            disabled={isProcessing}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isProcessing ? 'Migrating...' : 'Start Legacy Migration'}
          </Button>
          {migrationStatus && (
            <p className={`mt-2 text-sm ${migrationStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
              {migrationStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
