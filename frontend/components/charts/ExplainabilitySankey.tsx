'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

import { useTheme } from '@/components/providers/theme-provider';
import { echarts } from './echartsClient';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface SankeyData {
  nodes: Array<{ id: string; name: string }>;
  links: Array<{ source: string; target: string; value: number; rule?: string }>;
}

interface Props {
  requestId: string | null;
}

function resolveTextColor(theme: string) {
  return theme === 'dark' ? '#e2e8f0' : '#0f172a';
}

export function ExplainabilitySankey({ requestId }: Props) {
  const { theme } = useTheme();
  const [data, setData] = React.useState<SankeyData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    async function loadTrace() {
      if (!requestId) {
        setData(null);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/rules/trace/${requestId}`, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Kan explainability-trace niet laden (status ${response.status}).`);
        }
        const payload = await response.json();
        if (isMounted) {
          setData(payload);
        }
      } catch (err) {
        console.error('Failed to load sankey data', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Onbekende fout bij laden van trace.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTrace();
    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const option = React.useMemo(() => {
    const textColor = resolveTextColor(theme);
    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.data?.rule) {
            return `${params.name}<br/>${params.data.rule}`;
          }
          return params.name;
        }
      },
      series: [
        {
          type: 'sankey',
          emphasis: { focus: 'adjacency' },
          lineStyle: { curveness: 0.5, opacity: 0.6 },
          label: {
            color: textColor,
            fontSize: 12
          },
          data: (data?.nodes ?? []).map(node => ({ name: node.name ?? node.id })),
          links: data?.links ?? []
        }
      ]
    };
  }, [data, theme]);

  return (
    <section className="card p-5">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="section-title">Explainability</p>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Rule trace Sankey</h3>
        </div>
        {requestId && (
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-xs font-semibold text-subtle">
            #{requestId}
          </span>
        )}
      </header>

      {!requestId && (
        <p className="text-sm text-subtle">Selecteer een certificaat om de rule-trace te bekijken.</p>
      )}

      {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      <div className="mt-4 min-h-[260px] rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface-muted)]/50">
        {requestId && !loading && data && data.nodes.length > 0 ? (
          <ReactECharts echarts={echarts} option={option} style={{ height: 260 }} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-subtle">
            {loading ? 'Explainability wordt geladen…' : 'Nog geen trace beschikbaar voor deze selectie.'}
          </div>
        )}
      </div>
    </section>
  );
}

