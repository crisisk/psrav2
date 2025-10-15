'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

import { useTheme } from '@/components/providers/theme-provider';
import { echarts } from './echartsClient';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface Props {
  label: string;
  value?: number | null;
  min?: number;
  max?: number;
  formatPercent?: boolean;
  suffix?: string;
  unitLabel?: string;
  description?: string;
  isLoading?: boolean;
  error?: string | null;
}

function resolveColors(theme: string) {
  if (theme === 'dark') {
    return {
      track: '#1f2937',
      progress: ['#60a5fa', '#38bdf8'],
      title: '#e2e8f0',
      detail: '#f8fafc'
    };
  }
  return {
    track: '#e2e8f0',
    progress: ['#2563eb', '#38bdf8'],
    title: '#0f172a',
    detail: '#0f172a'
  };
}

export function KpiGauge({
  label,
  value = null,
  min = 0,
  max = 1,
  formatPercent = true,
  suffix = '',
  unitLabel,
  description,
  isLoading = false,
  error = null,
}: Props) {
  const { theme } = useTheme();
  const titleId = React.useId();
  const statusId = React.useId();

  const hasValue = typeof value === 'number' && Number.isFinite(value);
  const displayed = React.useMemo(() => {
    if (!hasValue) {
      return null;
    }
    return formatPercent ? value * 100 : value;
  }, [formatPercent, hasValue, value]);

  const colors = React.useMemo(() => resolveColors(theme), [theme]);

  const formattedValue = React.useMemo(() => {
    if (!hasValue || displayed === null) {
      return 'Geen data';
    }

    const precision = Math.abs(displayed) >= 10 || !formatPercent ? 0 : 1;
    return `${displayed.toFixed(precision)}${formatPercent ? '%' : ''}${suffix}`;
  }, [displayed, formatPercent, hasValue, suffix]);

  const option = React.useMemo(() => {
    if (!hasValue || displayed === null) {
      return null;
    }

    return {
      tooltip: { show: true },
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: formatPercent ? 0 : min,
          max: formatPercent ? 100 : max,
          progress: {
            show: true,
            roundCap: true,
            width: 10,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 1,
                y2: 0,
                colorStops: [
                  { offset: 0, color: colors.progress[0] },
                  { offset: 1, color: colors.progress[1] }
                ]
              }
            }
          },
          axisLine: {
            lineStyle: {
              width: 10,
              color: [[1, colors.track]]
            }
          },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: {
            show: true,
            offsetCenter: [0, '60%'],
            fontSize: 12,
            color: colors.title
          },
          detail: {
            valueAnimation: true,
            formatter: formattedValue,
            fontSize: 20,
            color: colors.detail
          },
          data: [
            {
              value: displayed,
              name: label
            }
          ]
        }
      ]
    };
  }, [colors, displayed, formatPercent, formattedValue, hasValue, label, max, min]);

  const statusMessage = error ?? (hasValue ? `Laatste waarde ${formattedValue}` : 'Nog geen meetwaarde beschikbaar');

  return (
    <div className="card flex flex-col gap-4 p-4" role="group" aria-labelledby={titleId} aria-describedby={statusId}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p id={titleId} className="section-title">
            {label}
          </p>
          {unitLabel && <p className="text-xs text-subtle">{unitLabel}</p>}
        </div>
        {description && <span className="badge badge-neutral text-xs">{description}</span>}
      </div>

      <div className="relative h-44" aria-live="polite">
        {isLoading && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-subtle">
            <span className="h-10 w-10 animate-spin rounded-full border-2 border-[rgba(148,163,184,0.4)] border-t-transparent" aria-hidden="true" />
            Waarde wordt geladen…
          </div>
        )}

        {!isLoading && error && (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-[rgba(248,113,113,0.4)] bg-[var(--color-danger-soft)]/70 p-4 text-center text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {!isLoading && !error && option && (
          <ReactECharts echarts={echarts} option={option} style={{ height: 180 }} aria-hidden="true" />
        )}

        {!isLoading && !error && !option && (
          <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-[rgba(148,163,184,0.4)] bg-[var(--color-surface-muted)]/60 p-4 text-center text-sm text-subtle">
            Voeg een gegevensbron toe om deze KPI te vullen.
          </div>
        )}
      </div>

      <dl className="grid gap-1 text-sm text-subtle">
        <div className="flex items-center justify-between">
          <dt>Waarde</dt>
          <dd className="font-semibold text-[var(--color-text)]">{formattedValue}</dd>
        </div>
        <dd id={statusId}>{statusMessage}</dd>
      </dl>
    </div>
  );
}

