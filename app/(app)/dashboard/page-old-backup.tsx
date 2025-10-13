'use client';
import { useState } from 'react';
import { HeroStrip } from '@/shared/ui/dashboard/HeroStrip';
import { InsightsRow } from '@/shared/ui/dashboard/InsightsRow';
import { AssessmentsTable } from '@/shared/ui/dashboard/AssessmentsTable';
import { MissingCooList } from '@/shared/ui/dashboard/MissingCooList';
import { OriginCheckForm } from '@/shared/ui/forms/OriginCheckForm';
import { LTSDGeneratorForm } from '@/shared/ui/forms/LTSDGeneratorForm';
import { CooUploadForm } from '@/shared/ui/forms/CooUploadForm';

export default function DashboardPage(){
  const ltsdId = 'demo-ltsd-1'; // replace with ctx/param
  const [activeModal, setActiveModal] = useState<'origin' | 'ltsd' | 'coo' | null>(null);

  return (
    <div className="space-y-6">
      <HeroStrip />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setActiveModal('origin')}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-shadow"
        >
          <h3 className="text-lg font-semibold">Origin Check</h3>
          <p className="text-gray-600">Verify product origin requirements</p>
        </div>

        <div
          onClick={() => setActiveModal('ltsd')} 
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-shadow"
        >
          <h3 className="text-lg font-semibold">Generate LTSD</h3>
          <p className="text-gray-600">Create a new LTSD document</p>
        </div>

        <div
          onClick={() => setActiveModal('coo')}
          className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md cursor-pointer transition-shadow"
        >
          <h3 className="text-lg font-semibold">Upload COO</h3>
          <p className="text-gray-600">Submit certificate of origin</p>
        </div>
      </div>

      {activeModal === 'origin' && (
        <OriginCheckForm onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'ltsd' && (
        <LTSDGeneratorForm onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'coo' && (
        <CooUploadForm onClose={() => setActiveModal(null)} />
      )}

      <InsightsRow />
      <AssessmentsTable />
      <MissingCooList ltsdId={ltsdId} />
    </div>
  );
}