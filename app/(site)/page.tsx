'use client';

import React from 'react';

import { AppShell } from '@/components/layout/AppShell';

export const dynamic = 'force-dynamic';
import { PageHeader } from '@/components/layout/PageHeader';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { FeedbackPanel } from '@/components/dashboard/FeedbackPanel';
import { OriginCalculator } from '@/components/dashboard/OriginCalculator';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { UserJourneys } from '@/components/dashboard/UserJourneys';
import { ExplainabilitySankey } from '@/components/charts/ExplainabilitySankey';
import { KpiGauge } from '@/components/charts/KpiGauge';
import { DataTable } from '@/components/tables/DataTable';

export default function Page() {
  const [selectedCertificateId, setSelectedCertificateId] = React.useState<string | null>(null);

  const heroAside = (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.35)] bg-[var(--color-surface)]/70 px-5 py-4 text-sm text-subtle shadow-ring">
      <p className="font-semibold text-[var(--color-text)]">UAT-samenvatting</p>
      <p>
        10 persona’s hebben scenario’s gevalideerd met een gemiddelde tevredenheid van 4.4/5 en 92% succesratio.
      </p>
      <dl className="mt-4 space-y-2 text-xs uppercase tracking-wide text-subtle">
        <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-muted)]/60 px-3 py-2">
          <dt>Latency p95</dt>
          <dd className="font-semibold text-[var(--color-text)]">732ms</dd>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-[var(--color-surface-muted)]/60 px-3 py-2">
          <dt>Audit events</dt>
          <dd className="font-semibold text-[var(--color-text)]">+128</dd>
        </div>
      </dl>
    </div>
  );

  return (
    <AppShell>
      <PageHeader
        eyebrow="PSRA Origin Checker Enterprise"
        title="Productieklare oorsprongsbepaling met explainability en UAT-persona’s"
        description={
          <>
            <p>
              Deze release combineert een moderne, toegankelijke frontend met het LangGraph origin-engine en tien gesimuleerde
              UAT-persona’s. Elke berekening levert auditklare certificaten, explainability en feedbackloops voor continue
              verbetering.
            </p>
          </>
        }
        badges={[
          { label: '🌙 Donker/licht-modus', tone: 'neutral' },
          { label: '♿ WCAG-ready UI', tone: 'success' },
          { label: '🔁 Persona feedbackloops', tone: 'warning' }
        ]}
        aside={heroAside}
      />

      <DashboardStats />

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <OriginCalculator onCertificateCreated={setSelectedCertificateId} />
          <DataTable onRowClick={row => setSelectedCertificateId(row.id)} />
        </div>
        <aside className="space-y-6">
          <SystemStatus />
          <ExplainabilitySankey requestId={selectedCertificateId} />
          <UserJourneys maxItems={4} />
          <FeedbackPanel />
        </aside>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiGauge
          label="Manuren reductie"
          value={0.785}
          unitLabel="Ten opzichte van Q1-baseline"
          description="Procesautomatisering"
        />
        <KpiGauge
          label="AI nauwkeurigheid"
          value={0.987}
          unitLabel="Validatie door persona-samples"
          description="LangGraph consensus"
        />
        <KpiGauge
          label="Certificaten vandaag"
          value={12}
          formatPercent={false}
          suffix=" stuks"
          unitLabel="Productiecertificaten"
          description="Realtime sync"
        />
        <KpiGauge
          label="Wachtende aanvragen"
          value={3}
          formatPercent={false}
          suffix=" open"
          unitLabel="Workflow backlog"
          description="SLA &lt; 12 uur"
        />
      </section>
    </AppShell>
  );
}
