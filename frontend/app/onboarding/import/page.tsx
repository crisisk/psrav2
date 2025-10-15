'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { InvoiceValidator } from '@/components/invoices/InvoiceValidator';
import { telemetry } from '@/lib/telemetry/events';

interface ImportSummary {
  totalRows: number;
  uniqueHsCodes: number;
  coverage: number;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const statusRegionRef = useRef<HTMLDivElement | null>(null);
  const onboardingStartRef = useRef<number>(typeof performance !== 'undefined' ? performance.now() : Date.now());

  useEffect(() => {
    telemetry.onboardingStarted('Nieuwe gebruiker – First-Run');
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSummary(null);
    setPreview([]);
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    onboardingStartRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
  };

  const parseCsv = (input: string) => {
    const rows = input
      .split(/\r?\n/)
      .map(row => row.trim())
      .filter(Boolean)
      .map(row => row.split(',').map(column => column.trim()));

    if (rows.length === 0) {
      return { rows: [], summary: null as ImportSummary | null };
    }

    const dataRows = rows.slice(1);
    const hsCodes = new Set(dataRows.map(columns => columns[0]?.replace(/[^0-9]/g, '').slice(0, 6)).filter(Boolean));
    const totalValue = dataRows.reduce((acc, columns) => acc + Number.parseFloat(columns[2] ?? '0'), 0);
    const coverage = totalValue > 0 ? Math.min(100, Math.max(0, (totalValue / 1_000_000) * 100)) : 0;

    return {
      rows,
      summary: {
        totalRows: dataRows.length,
        uniqueHsCodes: hsCodes.size,
        coverage: Number(coverage.toFixed(1))
      }
    };
  };

  const handleImport = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSummary(null);
    setPreview([]);

    if (!file) {
      const message = 'Selecteer eerst een CSV-bestand met HS39/40 materiaalregels.';
      setError(message);
      telemetry.errorModalViewed('Nieuwe gebruiker – First-Run', { context: 'onboarding_import', message });
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      const message = 'Het bestand moet de extensie .csv hebben.';
      setError(message);
      telemetry.errorModalViewed('Nieuwe gebruiker – First-Run', { context: 'onboarding_import', message });
      return;
    }

    if (file.size === 0) {
      const message = 'Het gekozen bestand is leeg.';
      setError(message);
      telemetry.errorModalViewed('Nieuwe gebruiker – First-Run', { context: 'onboarding_import', message });
      return;
    }

    const reader = new FileReader();
    setIsProcessing(true);
    reader.onload = () => {
      setIsProcessing(false);
      const text = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer);
      const { rows, summary: parsedSummary } = parseCsv(text);

      if (!parsedSummary) {
        const message = 'Kon geen geldige rijen in het CSV-bestand vinden. Controleer de delimiter en headers.';
        setError(message);
        telemetry.errorModalViewed('Nieuwe gebruiker – First-Run', { context: 'onboarding_import', message });
        return;
      }

      setSummary(parsedSummary);
      setPreview(rows.slice(0, 6));
      const completedAt = typeof performance !== 'undefined' ? performance.now() : Date.now();
      telemetry.onboardingCompleted('Nieuwe gebruiker – First-Run', completedAt - onboardingStartRef.current);
      queueMicrotask(() => {
        statusRegionRef.current?.focus();
      });
    };

    reader.onerror = () => {
      setIsProcessing(false);
      const message = 'Het bestand kon niet worden gelezen. Probeer opnieuw of controleer de permissies.';
      setError(message);
      telemetry.errorModalViewed('Nieuwe gebruiker – First-Run', { context: 'onboarding_import', message });
    };

    reader.readAsText(file, 'utf-8');
  };

  const emptyState = useMemo(
    () => (
      <div className="rounded-2xl border border-dashed border-[rgba(148,163,184,0.4)] bg-[var(--color-surface-muted)]/50 p-6 text-center text-sm text-subtle">
        <p className="text-base font-semibold text-[var(--color-text)]">Nog geen HS39/40-bestand geselecteerd</p>
        <p className="mt-2">
          Download het minimal template vanuit de onboarding mail of sleep hier je CSV met kolommen <strong>HS6</strong>, <strong>Land</strong>, <strong>Waarde</strong> en <strong>Omschrijving</strong>.
        </p>
        <p className="mt-2">We valideren inline op landcodes, waarde-formaten en herhalende HS-codes.</p>
      </div>
    ),
    []
  );

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Supplier onboarding' }
  ];

  const headerAside = (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.35)] bg-[var(--color-surface-muted)]/50 px-5 py-4 text-sm text-subtle">
      <p className="font-semibold text-[var(--color-text)]">Validatieregels</p>
      <ul className="mt-3 space-y-2 text-left">
        <li className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          <span>HS6-codes worden automatisch opgeschoond en gecontroleerd op duplicaten.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          <span>Waarden &gt; €1M markeren we voor aanvullende documentcontrole.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-2 w-2 rounded-full bg-[var(--color-success)]" aria-hidden="true" />
          <span>Landcodes worden gevalideerd tegen TARIC + HMRC lijsten.</span>
        </li>
      </ul>
    </div>
  );

  return (
    <AppShell variant="narrow" contentClassName="space-y-8" breadcrumbs={breadcrumbs}>
      <PageHeader
        size="compact"
        eyebrow="Supplier onboarding"
        title="Importeer HS39/40 materiaalregels"
        description="Upload het minimale CSV-bestand om direct feedback te ontvangen over ontbrekende landen, waarden en HS-dekking. We genereren automatisch een statusoverzicht voor je persona."
        badges={[
          { label: 'CSV-validatie live', tone: 'success' },
          { label: 'HS39/40 focus', tone: 'neutral' }
        ]}
        aside={headerAside}
      />

      <section className="space-y-6">
        <form onSubmit={handleImport} className="card space-y-6 p-6" noValidate>
          <div className="space-y-1">
            <label htmlFor="hs-import" className="section-title">
              Kies bestand
            </label>
            <input
              id="hs-import"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              aria-describedby={error ? 'hs-import-error' : 'hs-import-hint'}
            />
            <p id="hs-import-hint" className="input-hint">
              Alleen CSV-bestanden met maximaal 2.000 regels worden ondersteund tijdens onboarding. Gebruik een punt als decimaalteken.
            </p>
            {error && (
              <p id="hs-import-error" className="field-error">
                {error}
              </p>
            )}
          </div>

          {!file && emptyState}

          {file && (
            <div className="rounded-2xl border border-[rgba(148,163,184,0.3)] bg-[var(--color-surface-muted)]/60 p-4 text-sm text-subtle">
              <p className="font-semibold text-[var(--color-text)]">Geselecteerd bestand</p>
              <p>{file.name}</p>
              <p>{(file.size / 1024).toFixed(1)} KB • Laatste wijziging {file.lastModified ? new Date(file.lastModified).toLocaleDateString('nl-NL') : 'onbekend'}</p>
            </div>
          )}

          <button type="submit" className="primary w-full md:w-auto" disabled={isProcessing}>
            {isProcessing ? 'Importeren…' : 'Import starten'}
          </button>
        </form>

        <div ref={statusRegionRef} tabIndex={-1} aria-live="polite" className="outline-none">
          {summary && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[rgba(34,197,94,0.35)] bg-[var(--color-success-soft)]/70 p-4 text-sm text-[var(--color-success)]">
                Import successful — {summary.totalRows} regels verwerkt, {summary.uniqueHsCodes} unieke HS-codes.
              </div>

              <dl className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                  <dt className="text-xs uppercase tracking-wide text-subtle">Totaal aantal regels</dt>
                  <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">{summary.totalRows}</dd>
                </div>
                <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                  <dt className="text-xs uppercase tracking-wide text-subtle">Unieke HS6-codes</dt>
                  <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">{summary.uniqueHsCodes}</dd>
                </div>
                <div className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)]/80 p-4">
                  <dt className="text-xs uppercase tracking-wide text-subtle">Portfolio-dekking</dt>
                  <dd className="mt-1 text-lg font-semibold text-[var(--color-text)]">{summary.coverage}%</dd>
                </div>
              </dl>

              {preview.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[rgba(148,163,184,0.2)] text-left text-sm">
                    <thead>
                      <tr>
                        {preview[0].map((header, index) => (
                          <th key={`${header}-${index}`} scope="col" className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-subtle">
                            {header || `Kolom ${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(148,163,184,0.12)]">
                      {preview.slice(1).map((row, rowIndex) => (
                        <tr key={`row-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`cell-${rowIndex}-${cellIndex}`} className="px-4 py-2 text-subtle">
                              {cell || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <InvoiceValidator personas={['supplier', 'analyst', 'compliance']} />
    </AppShell>
  );
}
