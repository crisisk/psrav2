'use client';

import { personaScenarios, type PersonaScenario } from '@/data/persona-scenarios';

interface Props {
  personas?: PersonaScenario[];
  maxItems?: number;
}

export function UserJourneys({ personas = personaScenarios, maxItems = 5 }: Props) {
  const selection = personas.slice(0, maxItems);

  return (
    <section className="card p-6">
      <header className="mb-4">
        <p className="section-title">UAT journeys</p>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Persona flows & validatie</h3>
        <p className="text-sm text-subtle">
          Overzicht van de tien UAT-persona’s met belangrijkste validatiepunten en opvolgacties.
        </p>
      </header>

      <ol className="space-y-4">
        {selection.map(persona => (
          <li key={persona.id} className="rounded-2xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface)]/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="text-base font-semibold text-[var(--color-text)]">{persona.name}</h4>
                <p className="text-xs uppercase tracking-wide text-subtle">{persona.role}</p>
              </div>
              <span className="rounded-full bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--color-text)]">
                {persona.agreement}
              </span>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text)]">{persona.objective}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Succescriteria</p>
                <ul className="mt-1 space-y-1 text-sm text-subtle">
                  {persona.successCriteria.slice(0, 2).map(item => (
                    <li key={`${persona.id}-success-${item}`} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-subtle">Belangrijkste risico</p>
                <ul className="mt-1 space-y-1 text-sm text-subtle">
                  {persona.riskFocus.slice(0, 2).map(item => (
                    <li key={`${persona.id}-risk-${item}`} className="flex gap-2">
                      <span aria-hidden="true">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-[rgba(148,163,184,0.2)] bg-[var(--color-surface-muted)]/80 p-3 text-xs text-subtle">
              <strong className="font-semibold text-[var(--color-text)]">Follow-up:</strong>{' '}
              {persona.insights.followUpActions.join('; ')}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

