'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import { z } from 'zod';

import type { CertificateStatus } from '@/lib/repository';
import { formatRelativeTimeFromNow } from '@/lib/utils/time';

const REFRESH_INTERVAL_MS = 30000;

const CERTIFICATE_STATUS_VALUES = ['pending', 'processing', 'done', 'failed'] as const satisfies CertificateStatus[];

const CertificateRowSchema = z.object({
  id: z.string(),
  productSku: z.string(),
  hs6: z.string(),
  agreement: z.string(),
  status: z.enum([...CERTIFICATE_STATUS_VALUES]),
  result: z
    .object({
      isConform: z.boolean().optional(),
      confidence: z.number().min(0).max(1).optional()
    })
    .passthrough()
    .nullish(),
  createdAt: z.string(),
  updatedAt: z.string()
});

const CertificateResponseSchema = z.object({
  items: z.array(CertificateRowSchema).default([]),
  total: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional()
});

interface CertificateRow {
  id: string;
  productSku: string;
  hs6: string;
  agreement: string;
  status: CertificateStatus;
  result?: {
    isConform?: boolean;
    confidence?: number;
    [key: string]: unknown;
  };
  createdAt: string;
  updatedAt: string;
}

const STATUS_STYLES: Record<CertificateStatus, { label: string; className: string }> = {
  pending: { label: 'In wachtrij', className: 'badge badge-neutral' },
  processing: { label: 'Bezig', className: 'badge badge-warning' },
  done: { label: 'Voltooid', className: 'badge badge-success' },
  failed: { label: 'Mislukt', className: 'badge badge-error' }
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatConfidence(row: CertificateRow) {
  if (!row.result || typeof row.result.confidence !== 'number') {
    return '—';
  }
  const percentage = Math.round(row.result.confidence * 100);
  return `${percentage}%`;
}

export function DataTable({ onRowClick }: { onRowClick?: (row: CertificateRow) => void }) {
  const [rows, setRows] = useState<CertificateRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const loadCertificates = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setError(null);
      }

      try {
        const response = await fetch('/api/certificates?pageSize=25', {
          cache: 'no-store',
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error(`Kan certificaten niet laden (status ${response.status}).`);
        }

        const payload = await response.json();
        const data = CertificateResponseSchema.parse(payload);

        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }

        const normalizedRows: CertificateRow[] = data.items.map(item => ({
          id: item.id,
          productSku: item.productSku,
          hs6: item.hs6,
          agreement: item.agreement,
          status: item.status,
          result: item.result ?? undefined,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }));

        const timestamp = new Date();

        setRows(normalizedRows);
        setLastUpdated(timestamp);
        setLiveAnnouncement(
          `Certificaatlog ververst. ${normalizedRows.length} resultaten bijgewerkt om ${timestamp.toLocaleTimeString('nl-NL')}.`
        );
        setError(null);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        console.error('Failed to load certificates', err);
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Onbekende fout tijdens het laden van certificaten.');
        setLiveAnnouncement('Bijwerken van certificaten is mislukt. Laatste dataset blijft zichtbaar.');
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }
        if (silent) {
          setIsRefreshing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    isMountedRef.current = true;

    loadCertificates();
    const interval = window.setInterval(() => {
      void loadCertificates({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
      window.clearInterval(interval);
    };
  }, [loadCertificates]);

  const columns = useMemo<ColumnDef<CertificateRow>[]>(
    () => [
      {
        accessorKey: 'productSku',
        header: 'SKU',
        cell: info => (
          <span className="font-semibold text-[var(--color-text)]">{info.getValue<string>()}</span>
        )
      },
      {
        accessorKey: 'hs6',
        header: 'HS6',
        cell: info => <span className="font-mono text-sm text-subtle">{info.getValue<string>()}</span>
      },
      {
        accessorKey: 'agreement',
        header: 'Verdrag',
        cell: info => <span className="text-sm text-subtle">{info.getValue<string>()}</span>
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: info => {
          const status = info.getValue<CertificateStatus>();
          const styles = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
          return <span className={styles.className}>{styles.label}</span>;
        }
      },
      {
        id: 'confidence',
        header: 'Vertrouwen',
        cell: info => <span className="text-sm text-subtle">{formatConfidence(info.row.original)}</span>
      },
      {
        accessorKey: 'createdAt',
        header: 'Aangemaakt',
        cell: info => <span className="text-sm text-subtle">{formatDate(info.getValue<string>())}</span>
      }
    ],
    []
  );

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  const lastUpdatedMeta = useMemo(() => {
    if (!lastUpdated) {
      return { formatted: '—', relative: null as string | null, iso: undefined as string | undefined };
    }

    return {
      formatted: lastUpdated.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      relative: formatRelativeTimeFromNow(lastUpdated),
      iso: lastUpdated.toISOString()
    };
  }, [lastUpdated]);

  return (
    <section className="card p-6" aria-live="polite">
      <header className="flex flex-col gap-2 border-b border-[rgba(148,163,184,0.2)] pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-title">Certificaat aanvragen</p>
          <h3 className="text-xl font-semibold text-[var(--color-text)]">Realtime certificaatlog</h3>
          <p className="text-sm text-subtle">
            Alle berekeningen worden iedere 30 seconden ververst. Klik op een rij om de explainability-flow te bekijken.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
          <div
            className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 font-semibold"
            role="status"
            aria-live="polite"
          >
            {rows.length} resultaten
          </div>
          <div className="flex items-center gap-2">
            <span>
              Laatste update:{' '}
              {lastUpdatedMeta.iso ? (
                <time dateTime={lastUpdatedMeta.iso}>{lastUpdatedMeta.formatted}</time>
              ) : (
                '—'
              )}
            </span>
            {lastUpdatedMeta.relative ? <span className="text-[0.7rem]">({lastUpdatedMeta.relative})</span> : null}
          </div>
          <button
            type="button"
            className="ghost inline-flex items-center gap-2 text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
            onClick={() => {
              void loadCertificates();
            }}
            disabled={isLoading || isRefreshing}
          >
            <span aria-hidden="true">↻</span>
            {isRefreshing ? 'Verversen…' : 'Nu verversen'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mt-4 rounded-xl border border-[rgba(248,113,113,0.3)] bg-[var(--color-danger-soft)]/80 p-4 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      <div
        className="mt-4 table-container"
        aria-busy={isLoading || isRefreshing}
        role="region"
        aria-label="Certificaat resultaten"
      >
        <table>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} scope="col">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="animate-pulse">
                    <td colSpan={columns.length} className="px-4 py-4">
                      <div className="h-3 w-full rounded-full bg-[var(--color-surface-muted)]" />
                    </td>
                  </tr>
                ))
              : table.getRowModel().rows.length > 0
              ? table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className="cursor-pointer transition-colors hover:bg-[rgba(37,99,235,0.06)] dark:hover:bg-[rgba(96,165,250,0.12)]"
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              : (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-10 text-center text-subtle">
                      Geen certificaten gevonden voor de huidige filters.
                    </td>
                  </tr>
                )}
          </tbody>
        </table>
      </div>
      <p className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </p>
    </section>
  );
}

