'use client';

import { useEffect, useState } from 'react';

type SystemMetadata = {
  system: {
    platform: string;
    arch: string;
    nodeVersion: string;
  };
  version: string;
  serverDate: string;
};

export function SystemMetadataCard() {
  const [metadata, setMetadata] = useState<SystemMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientDate, setClientDate] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/metadata');
        if (!response.ok) throw new Error('API request failed');
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        setMetadata(data);
        setClientDate(new Date().toLocaleString());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      }
    };

    fetchMetadata();
  }, []);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-600">Loading system metadata...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">System Information</h2>
      
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Application Version:</span>
          <span className="font-mono">{metadata.version}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Platform:</span>
          <span className="font-mono">{metadata.system.platform}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Architecture:</span>
          <span className="font-mono">{metadata.system.arch}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Node.js Version:</span>
          <span className="font-mono">{metadata.system.nodeVersion}</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Server Time (UTC):</span>
          <span className="font-mono">
            {new Date(metadata.serverDate).toLocaleString()}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600">Client Time:</span>
          <span className="font-mono">{clientDate}</span>
        </div>
      </div>
    </div>
  );
}
