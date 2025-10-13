'use client';

import { ChainOverview } from '@/shared/ui/supplier/ChainOverview';
import { AddCooWizard } from '@/shared/ui/supplier/AddCooWizard';
import { FinalizeLTSDButton } from '@/shared/ui/supplier/FinalizeLTSDButton';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SupplierPage() {
  const ltsdId = 'demo-ltsd-1'; // Replace with actual ltsdId from context/params
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-sevensa-teal to-sevensa-teal-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Supplier Portal 📦</h1>
        <p className="text-white/90 text-lg">
          Upload Certificates of Origin, track status en maak de supply chain compleet. Simpel en snel.
        </p>
      </div>

      <ChainOverview ltsdId={ltsdId} onSelectNode={setSelectedNodeId} />

      <FinalizeLTSDButton 
        ltsdId={ltsdId}
        onSuccess={() => toast.success('LTSD successfully finalized')}
      />

      {selectedNodeId && (
        <AddCooWizard
          ltsdId={ltsdId}
          nodeId={selectedNodeId}
          onDone={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
