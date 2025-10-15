import type { InvoiceValidationResult } from '@/lib/invoice-validator';

interface Props {
  result: InvoiceValidationResult;
  personas: string[];
}

function formatStatus(status: InvoiceValidationResult['checks'][number]) {
  switch (status.status) {
    case 'pass':
      return {
        tone: 'text-[var(--color-success)] border-[rgba(34,197,94,0.35)] bg-[var(--color-success-soft)]/70',
        label: 'Geslaagd',
      };
    case 'warn':
      return {
        tone: 'text-amber-500 border-amber-300/60 bg-amber-50/70',
        label: 'Let op',
      };
    case 'fail':
    default:
      return {
        tone: 'text-[var(--color-danger)] border-[rgba(248,113,113,0.4)] bg-[var(--color-danger-soft)]/70',
        label: 'Gefaalde check',
      };
  }
}

export function InvoiceValidationResults({ result, personas }: Props) {
  const eligibleMessage = result.eligibility.eligible
    ? 'Factuur is (voorwaardelijk) geschikt voor een certificate of preferential origin.'
    : 'Factuur voldoet nog niet aan de eisen voor een certificate of preferential origin.';

  const filteredIntegrations = result.integrationOptions.filter(option =>
    option.personas.some(persona => personas.includes(persona))
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[rgba(94,234,212,0.4)] bg-[var(--color-success-soft)]/70 p-4 text-sm text-[var(--color-success)]">
        {eligibleMessage}
        <p className="mt-2 text-[var(--color-text)]">
          {result.eligibility.rationale} • Vertrouwen: {(result.eligibility.confidence * 100).toFixed(0)}%
        </p>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">Validator resultaten</h3>
        <ul className="space-y-3">
          {result.checks.map(check => {
            const tone = formatStatus(check);
            return (
              <li key={check.id} className={`rounded-xl border px-4 py-3 text-sm ${tone.tone}`}>
                <p className="font-semibold">{check.label}</p>
                <p className="mt-1">{check.details}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--color-text)]">BOM referenties</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[rgba(148,163,184,0.2)] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-subtle">
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">HS-code</th>
                <th className="px-3 py-2">Match</th>
                <th className="px-3 py-2">Waarde aandeel</th>
                <th className="px-3 py-2">PSR-status</th>
                <th className="px-3 py-2">Ruling</th>
                <th className="px-3 py-2">Handelsafspraken</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(148,163,184,0.12)]">
              {result.matchedReferences.map(reference => (
                <tr key={`${reference.matchedSku}-${reference.hsCode}`}>
                  <td className="px-3 py-2 font-medium text-[var(--color-text)]">{reference.matchedSku}</td>
                  <td className="px-3 py-2">{reference.hsCode}</td>
                  <td className="px-3 py-2">{Math.round(reference.matchScore * 100)}%</td>
                  <td className="px-3 py-2">{reference.materialShare.toFixed(1)}%</td>
                  <td
                    className={`px-3 py-2 ${
                      reference.thresholdBreached
                        ? 'text-[var(--color-danger)]'
                        : 'text-[var(--color-success)]'
                    }`}
                  >
                    {reference.thresholdBreached ? 'Boven limiet' : 'Binnen limiet'}
                  </td>
                  <td className="px-3 py-2">{reference.bindingRulingId ?? 'Nog niet gekoppeld'}</td>
                  <td className="px-3 py-2">{reference.tradeAgreementEligible ? 'Gedekt' : 'Niet gedekt'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredIntegrations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[var(--color-text)]">Integratieopties</h3>
          <p className="text-sm text-subtle">Koppel je ERP of documentbron zodat toekomstige facturen automatisch gevalideerd worden.</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {filteredIntegrations.map(option => (
              <li
                key={option.id}
                className="rounded-xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface-muted)]/60 p-4 text-sm"
              >
                <p className="font-semibold text-[var(--color-text)]">{option.label}</p>
                <p className="mt-1 text-subtle">{option.description}</p>
                <p className="mt-2 text-xs uppercase tracking-wide text-subtle">Endpoint</p>
                <code className="mt-1 block truncate text-xs">{option.endpoint}</code>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
