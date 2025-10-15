'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

import { formatRelativeTimeFromNow } from '@/lib/utils/time';

const REFRESH_INTERVAL_MS = 60000;

const HsCodesResponse = z.object({
  hsCodes: z
    .array(
      z.object({
        code: z.string(),
        description: z.string(),
        chapter: z.string(),
        section: z.string().optional()
      })
    )
    .default([])
});

const TradeAgreementsResponse = z.object({
  agreements: z.array(z.unknown()).default([])
});

const CertificatesResponse = z.object({
  items: z
    .array(
      z
        .object({
          hs6: z.string().optional()
        })
        .passthrough()
    )
    .default([])
});

interface MetricState {
  count: number;
  description: string;
  loading: boolean;
}

interface DashboardState {
  hs39Plastics: MetricState;
  hs40Rubber: MetricState;
  vhaRules: MetricState;
  materials: MetricState;
  lastUpdated?: Date;
}

const INITIAL_STATE: DashboardState = {
  hs39Plastics: { count: 0, description: 'Polymeerclassificaties', loading: true },
  hs40Rubber: { count: 0, description: 'Rubber artikelen', loading: true },
  vhaRules: { count: 0, description: 'Actieve handelsregels', loading: true },
  materials: { count: 0, description: 'Speciale materialen', loading: true }
};

const ICONS: Record<keyof Omit<DashboardState, 'lastUpdated'>, string> = {
  hs39Plastics: '🧪',
  hs40Rubber: '⚫',
  vhaRules: '📋',
  materials: '🔬'
};

const COLORS: Record<keyof Omit<DashboardState, 'lastUpdated'>, string> = {
  hs39Plastics: 'from-blue-500 to-sky-500',
  hs40Rubber: 'from-purple-500 to-indigo-500',
  vhaRules: 'from-emerald-500 to-lime-500',
  materials: 'from-amber-500 to-orange-500'
};

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardState>(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const setMetricsLoadingState = useCallback((loading: boolean) => {
    setStats(previous => ({
      hs39Plastics: { ...previous.hs39Plastics, loading },
      hs40Rubber: { ...previous.hs40Rubber, loading },
      vhaRules: { ...previous.vhaRules, loading },
      materials: { ...previous.materials, loading },
      lastUpdated: previous.lastUpdated
    }));
  }, []);

  const loadStats = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setIsRefreshing(true);
      if (!silent) {
        setMetricsLoadingState(true);
        setError(null);
      }

      try {
        const [hs39Response, hs40Response, agreementsResponse, certificatesResponse] = await Promise.all([
          fetch('/api/hs-codes?chapter=39', {
            cache: 'no-store',
            signal: controller.signal
          }),
          fetch('/api/hs-codes?chapter=40', {
            cache: 'no-store',
            signal: controller.signal
          }),
          fetch('/api/trade-agreements', {
            cache: 'no-store',
            signal: controller.signal
          }),
          fetch('/api/certificates?pageSize=100', {
            cache: 'no-store',
            signal: controller.signal
          })
        ]);

        if (!hs39Response.ok || !hs40Response.ok || !agreementsResponse.ok || !certificatesResponse.ok) {
          throw new Error('Een van de dashboardverzoeken is mislukt.');
        }

        const [hs39, hs40, agreements, certificates] = await Promise.all([
          hs39Response.json().then(payload => HsCodesResponse.parse(payload)),
          hs40Response.json().then(payload => HsCodesResponse.parse(payload)),
          agreementsResponse.json().then(payload => TradeAgreementsResponse.parse(payload)),
          certificatesResponse.json().then(payload => CertificatesResponse.parse(payload))
        ]);

        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }

        const uniqueMaterials = new Set(
          certificates.items.map(item => item?.hs6).filter((value): value is string => Boolean(value))
        );

        const timestamp = new Date();

        setStats({
          hs39Plastics: {
            count: hs39.hsCodes.length,
            description: 'Polymeerclassificaties',
            loading: false
          },
          hs40Rubber: {
            count: hs40.hsCodes.length,
            description: 'Rubber artikelen',
            loading: false
          },
          vhaRules: {
            count: agreements.agreements.length,
            description: 'Actieve handelsregels',
            loading: false
          },
          materials: {
            count: uniqueMaterials.size,
            description: 'Speciale materialen',
            loading: false
          },
          lastUpdated: timestamp
        });
        setError(null);
        setLiveAnnouncement(
          `Dashboardstatistieken ververst. ${hs39.hsCodes.length} HS39-items, ${hs40.hsCodes.length} HS40-items, ${agreements.agreements.length} handelsregels en ${uniqueMaterials.size} unieke materialen.`
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        console.error('Error fetching dashboard stats:', err);
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }

        setError('Kon statistieken niet verversen. Toon laatst bekende waarden.');
        setLiveAnnouncement('Bijwerken van dashboardstatistieken is mislukt. Laatst bekende waarden blijven zichtbaar.');
        setMetricsLoadingState(false);
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
        if (!isMountedRef.current || controller.signal.aborted) {
          return;
        }
        setIsRefreshing(false);
      }
    },
    [setMetricsLoadingState]
  );

  useEffect(() => {
    isMountedRef.current = true;

    loadStats();
    const interval = window.setInterval(() => {
      void loadStats({ silent: true });
    }, REFRESH_INTERVAL_MS);

    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort();
      controllerRef.current = null;
      window.clearInterval(interval);
    };
  }, [loadStats]);

  const tiles = (Object.entries(stats) as Array<[keyof DashboardState, MetricState | Date | undefined]>).filter(
    ([key]) => key !== 'lastUpdated'
  ) as Array<[keyof Omit<DashboardState, 'lastUpdated'>, MetricState]>;

  const lastUpdatedMeta = useMemo(() => {
    if (!stats.lastUpdated) {
      return { formatted: '—', relative: null as string | null, iso: undefined as string | undefined };
    }

    return {
      formatted: stats.lastUpdated.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
      relative: formatRelativeTimeFromNow(stats.lastUpdated),
      iso: stats.lastUpdated.toISOString()
    };
  }, [stats.lastUpdated]);

  return (
    <section className="grid gap-6 lg:grid-cols-4">
      {tiles.map(([key, metric]) => (
        <article key={key} className="gradient-surface rounded-2xl border border-[rgba(148,163,184,0.2)] p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-subtle">{metric.description}</p>
              {metric.loading ? (
                <div className="mt-4 space-y-2">
                  <div className="h-7 w-24 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
                  <div className="h-3 w-32 animate-pulse rounded-full bg-[var(--color-surface-muted)]" />
                </div>
              ) : (
                <p className="mt-4 text-3xl font-semibold text-[var(--color-text)]">
                  {metric.count.toLocaleString('nl-NL')}
                </p>
              )}
            </div>
            <div
              className={
                'grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-lg text-white shadow-lg ' +
                COLORS[key]
              }
            >
              <span aria-hidden="true">{ICONS[key]}</span>
            </div>
          </div>
        </article>
      ))}

      <div className="lg:col-span-4 flex flex-col gap-3 rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface)]/70 px-5 py-4 text-sm text-subtle sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span role="status" aria-live="polite">
            {error ?? (isRefreshing ? 'Bezig met verversen…' : 'Statistieken worden elke 60 seconden bijgewerkt.')}
          </span>
          {stats.lastUpdated && lastUpdatedMeta.relative ? (
            <span className="text-xs">({lastUpdatedMeta.relative})</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span>
            Laatste update:{' '}
            {lastUpdatedMeta.iso ? (
              <time dateTime={lastUpdatedMeta.iso}>{lastUpdatedMeta.formatted}</time>
            ) : (
              '—'
            )}
          </span>
          <button
            type="button"
            className="ghost inline-flex items-center gap-2 text-[var(--color-text-subtle)] transition-colors hover:text-[var(--color-text)]"
            onClick={() => {
              void loadStats();
            }}
            disabled={isRefreshing}
          >
            <span aria-hidden="true">↻</span>
            {isRefreshing ? 'Verversen…' : 'Nu verversen'}
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </p>
    </section>
  );
}

