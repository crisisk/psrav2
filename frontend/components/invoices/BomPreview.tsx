import type { BomLineItem } from '@/lib/invoice-validator';

interface Props {
  items: BomLineItem[];
}

export function BomPreview({ items }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[rgba(148,163,184,0.25)] bg-[var(--color-surface-muted)]/60 p-4">
      <p className="text-sm font-semibold text-[var(--color-text)]">
        Voorbeeld BOM-regels ({Math.min(5, items.length)} van {items.length})
      </p>
      <ul className="mt-3 space-y-2 text-sm text-subtle">
        {items.slice(0, 5).map(item => (
          <li
            key={`${item.sku}-${item.hsCode}`}
            className="flex flex-wrap justify-between gap-2 border-b border-[rgba(148,163,184,0.2)] pb-2 last:border-b-0"
          >
            <span className="font-medium text-[var(--color-text)]">{item.sku}</span>
            <span>{item.description}</span>
            <span>HS {item.hsCode}</span>
            <span>
              {item.quantity} × €{item.value.toFixed(2)}
              {item.countryOfOrigin ? ` • ${item.countryOfOrigin}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
