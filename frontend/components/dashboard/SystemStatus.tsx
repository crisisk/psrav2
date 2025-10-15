'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
  ok: boolean;
  timestamp: string;
  database: {
    enabled: boolean;
    ok: boolean;
    latencyMs: number | null;
    message: string;
  };
  cache: {
    enabled: boolean;
    connected: boolean;
    memoryEntries: number;
  };
  taskQueue: {
    enabled: boolean;
    connected: boolean;
    queues: string[];
  };
  notifications: {
    enabled: boolean;
  };
}

type StatusLevel = 'ready' | 'warning' | 'error';

const STATUS_META: Record<StatusLevel, { label: string; badgeClass: string; icon: string }> = {
  ready: {
    label: 'Operationeel',
    badgeClass: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
    icon: '✅'
  },
  warning: {
    label: 'Aandacht nodig',
    badgeClass: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
    icon: '⚠️'
  },
  error: {
    label: 'Onderbreking',
    badgeClass: 'bg-[var(--color-danger-soft)] text-[var(--color-danger)]',
    icon: '❌'
  }
};

interface StatusCardProps {
  title: string;
  status: StatusLevel;
  message: string;
  meta?: string;
}

function StatusCard({ title, status, message, meta }: StatusCardProps) {
  const metaConfig = STATUS_META[status];
  return (
    <article className="rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface)]/80 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
          <p className="mt-1 text-sm text-subtle">{message}</p>
          {meta && <p className="mt-2 text-xs text-subtle">{meta}</p>}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${metaConfig.badgeClass}`}>
          <span className="text-lg" aria-hidden="true">
            {metaConfig.icon}
          </span>
        </div>
      </div>
    </article>
  );
}

export function SystemStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string>('—');

  useEffect(() => {
    let isMounted = true;

    async function fetchStatus() {
      try {
        const response = await fetch('/api/health', { cache: 'no-store' });
        const payload: HealthStatus = await response.json();
        if (!isMounted) {
          return;
        }
        setHealth(payload);
        setError(null);
        setLastChecked(new Date().toLocaleTimeString('nl-NL'));
      } catch (err) {
        console.error('Failed to load system status', err);
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Onbekende fout bij het ophalen van health-status.');
        setHealth(null);
        setLastChecked(new Date().toLocaleTimeString('nl-NL'));
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const statusCards: StatusCardProps[] = [];

  if (health) {
    statusCards.push({
      title: 'Database',
      status: !health.database.enabled ? 'warning' : health.database.ok ? 'ready' : 'error',
      message: !health.database.enabled
        ? 'Database uitgeschakeld voor deze omgeving'
        : health.database.ok
        ? 'PostgreSQL bereikbaar'
        : 'Database niet bereikbaar',
      meta: health.database.latencyMs ? `${health.database.latencyMs} ms` : undefined
    });

    statusCards.push({
      title: 'Cache',
      status: !health.cache.enabled ? 'warning' : health.cache.connected ? 'ready' : 'error',
      message: !health.cache.enabled
        ? 'Redis staat uit voor deze tenant'
        : health.cache.connected
        ? 'Redis actief'
        : 'Redis niet bereikbaar',
      meta: `Items in cache: ${health.cache.memoryEntries}`
    });

    statusCards.push({
      title: 'Taakverwerking',
      status: !health.taskQueue.enabled ? 'warning' : health.taskQueue.connected ? 'ready' : 'error',
      message: !health.taskQueue.enabled
        ? 'Workers gedeactiveerd'
        : health.taskQueue.connected
        ? `Queues: ${health.taskQueue.queues.join(', ') || 'geen'}`
        : 'Task queue niet bereikbaar'
    });

    statusCards.push({
      title: 'Notificaties',
      status: health.notifications.enabled ? 'ready' : 'warning',
      message: health.notifications.enabled ? 'SMTP geconfigureerd' : 'Notificaties gedeactiveerd'
    });
  }

  return (
    <section className="card p-6">
      <header className="flex items-start justify-between">
        <div>
          <p className="section-title">Platform health</p>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Realtime afhankelijkheidsmonitor</h3>
          <p className="mt-1 text-sm text-subtle">
            Database, cache, wachtrijen en notificaties worden iedere 30 seconden geverifieerd.
          </p>
        </div>
        <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-subtle">
          Laatste check: {lastChecked}
        </span>
      </header>

      {error && (
        <p className="mt-4 rounded-2xl border border-[rgba(248,113,113,0.3)] bg-[var(--color-danger-soft)]/70 p-3 text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}

      <div className="mt-5 space-y-4">
        {statusCards.map(card => (
          <StatusCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}

