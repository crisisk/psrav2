'use client';

import { Plus, FileCheck, Upload } from 'lucide-react';
import { trackEvent } from '@/shared/lib/telemetry';

export function CTAStrip() {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <button 
        onClick={() => trackEvent('cta_click', { cta: 'start_origin_check' })}
        className="group bg-white dark:bg-dark-bg-surface border-2 border-sevensa-teal hover:bg-sevensa-teal rounded-xl p-6 transition-all duration-200 shadow-card hover:shadow-lg text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-sevensa-teal/10 group-hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-sevensa-teal group-hover:text-white transition-colors" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-sevensa-dark dark:text-dark-text-primary group-hover:text-white mb-1 transition-colors">
          Start Origin Check
        </h3>
        <p className="text-sm text-text-secondary group-hover:text-white/80 transition-colors">
          Nieuwe preferential origin assessment aanmaken
        </p>
      </button>

      <button 
        onClick={() => trackEvent('cta_click', { cta: 'generate_ltsd' })}
        className="group bg-white dark:bg-dark-bg-surface border-2 border-border dark:border-dark-border hover:border-sevensa-teal rounded-xl p-6 transition-all duration-200 shadow-card hover:shadow-lg text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-success" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-sevensa-dark dark:text-dark-text-primary mb-1">
          Genereer LTSD
        </h3>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
          Create Long-Term Supplier Declaration certificaat
        </p>
      </button>

      <button 
        onClick={() => trackEvent('cta_click', { cta: 'upload_coo' })}
        className="group bg-white dark:bg-dark-bg-surface border-2 border-border dark:border-dark-border hover:border-sevensa-teal rounded-xl p-6 transition-all duration-200 shadow-card hover:shadow-lg text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center">
            <Upload className="w-6 h-6 text-warning" />
          </div>
        </div>
        <h3 className="text-lg font-bold text-sevensa-dark dark:text-dark-text-primary mb-1">
          Upload CoO
        </h3>
        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
          Certificate of Origin van supplier uploaden
        </p>
      </button>
    </div>
  );
}
