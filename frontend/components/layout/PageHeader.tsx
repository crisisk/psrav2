import type { ReactNode } from 'react';
import clsx from 'clsx';

interface HeaderBadge {
  label: string;
  tone?: 'accent' | 'success' | 'warning' | 'neutral';
}

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  badges?: HeaderBadge[];
  aside?: ReactNode;
  align?: 'left' | 'center';
  size?: 'default' | 'compact';
  className?: string;
}

const badgeClassMap: Record<NonNullable<HeaderBadge['tone']>, string> = {
  accent: 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
  success: 'bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  neutral: 'bg-[var(--color-surface-muted)] text-[var(--color-text)]'
};

export function PageHeader({
  eyebrow,
  title,
  description,
  badges,
  aside,
  align = 'left',
  size = 'default',
  className
}: PageHeaderProps) {
  const containerClasses = clsx(
    'relative overflow-hidden rounded-3xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface)] shadow-lg',
    size === 'compact' ? 'px-6 py-8' : 'px-8 py-10',
    className
  );

  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left';

  return (
    <section className={containerClasses}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-[-10%] h-full w-1/2 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.18),_transparent_65%)]" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className={clsx('flex flex-col gap-5', alignment)}>
          {eyebrow && <span className="section-title">{eyebrow}</span>}
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--color-text)] lg:text-5xl">{title}</h1>
          {description && <div className="max-w-2xl text-lg text-subtle">{description}</div>}
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold lg:justify-start">
              {badges.map(badge => (
                <span
                  key={badge.label}
                  className={clsx('badge', badgeClassMap[badge.tone ?? 'neutral'])}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {aside && (
          <div className="flex flex-col items-stretch justify-start gap-4 lg:pl-6">
            {aside}
          </div>
        )}
      </div>
    </section>
  );
}
