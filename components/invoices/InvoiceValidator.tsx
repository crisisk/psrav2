'use client';

import { useMemo, useState } from 'react';

import { BomPreview } from '@/components/invoices/BomPreview';
import { InvoiceValidationResults } from '@/components/invoices/InvoiceValidationResults';
import { parseInvoiceCsv } from '@/components/invoices/parse-invoice-csv';
import type { InvoiceValidationResult, BomLineItem } from '@/lib/invoice-validator';

interface Props {
  personas: string[];
}
const DEFAULT_CURRENCY = 'EUR';

export function InvoiceValidator({ personas }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [issuedAt, setIssuedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
  const [bomItems, setBomItems] = useState<BomLineItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<InvoiceValidationResult | null>(null);

  const personaHint = useMemo(() => {
    if (personas.includes('supplier')) {
      return 'Leveranciers kunnen facturen uploaden om direct te zien welke regels aanvullende documentatie vereisen.';
    }
    if (personas.includes('analyst')) {
      return 'Operators krijgen inline inzicht in welke materialen extra HS-verificatie nodig hebben.';
    }
    if (personas.includes('compliance')) {
      return 'Compliance ziet per validator welke bewijsstukken ontbreken.';
    }
    return 'Controleer factuurregels op preferentiële oorsprong voordat je exporteert.';
  }, [personas]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    setError(null);
    setResult(null);
    if (!selected) {
      setFile(null);
      setBomItems([]);
      return;
    }

    setFile(selected);

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setError('Gebruik een CSV-export voor directe validatie. Andere formaten kunnen via de integratie opties gekoppeld worden.');
      setBomItems([]);
      return;
    }

    const { items, error: parseError } = await parseInvoiceCsv(selected);
    if (parseError) {
      setError(parseError);
      setBomItems([]);
      return;
    }

    setBomItems(items);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError('Upload eerst een factuur of BOM-bestand.');
      return;
    }

    if (bomItems.length === 0) {
      setError('Geen BOM-regels gevonden. Controleer het bestand op een header en minimaal één regel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/invoices/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-PSRA-Roles': 'supplier:upload analyst:read',
        },
        body: JSON.stringify({
          invoiceNumber,
          supplierName,
          currency,
          issuedAt,
          bomItems,
        }),
      });

      const responseBody = await response.text();
      let data: unknown = null;
      if (responseBody) {
        try {
          data = JSON.parse(responseBody) as unknown;
        } catch (parseError) {
          console.warn('Kon response niet parsen als JSON:', parseError);
        }
      }

      if (!response.ok || !data) {
        if (response.status === 422 && data && typeof data === 'object') {
          const details = (data as Record<string, any>).details;
          const fieldErrors = details?.fieldErrors as Record<string, string[] | undefined> | undefined;
          const firstError = fieldErrors
            ? Object.values(fieldErrors)
                .flat()
                .filter((message): message is string => Boolean(message))[0]
            : details?.formErrors?.[0];
          throw new Error(firstError ?? (data as Record<string, any>).message ?? 'Factuurvalidatie bevat fouten.');
        }

        throw new Error(
          (data as Record<string, any> | null)?.message ?? `Validatie mislukt (status ${response.status}).`
        );
      }

      setResult(data as InvoiceValidationResult);
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="card space-y-6 p-6" aria-live="polite">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-[var(--color-text)]">Factuurvalidatie & eligibility</h2>
        <p className="text-sm text-subtle">{personaHint}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="invoice-number" className="section-title">
              Factuurnummer
            </label>
            <input
              id="invoice-number"
              value={invoiceNumber}
              onChange={event => setInvoiceNumber(event.target.value)}
              placeholder="INV-2025-001"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="supplier-name" className="section-title">
              Leverancier
            </label>
            <input
              id="supplier-name"
              value={supplierName}
              onChange={event => setSupplierName(event.target.value)}
              placeholder="Klokkers Components BV"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="issued-at" className="section-title">
              Factuurdatum
            </label>
            <input
              id="issued-at"
              type="date"
              value={issuedAt}
              onChange={event => setIssuedAt(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="currency" className="section-title">
              Valuta
            </label>
            <input
              id="currency"
              value={currency}
              maxLength={3}
              onChange={event => setCurrency(event.target.value.toUpperCase())}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="invoice-file" className="section-title">
            Upload factuur of BOM-export (CSV)
          </label>
          <input id="invoice-file" type="file" accept=".csv" onChange={handleFileChange} />
          <p className="input-hint">Kolommen: SKU, omschrijving, HS-code, waarde, hoeveelheid, land van oorsprong.</p>
        </div>

        <BomPreview items={bomItems} />

        {error && <p className="field-error">{error}</p>}

        <button type="submit" className="primary w-full md:w-auto" disabled={isSubmitting}>
          {isSubmitting ? 'Valideren…' : 'Controleer eligibility'}
        </button>
      </form>

      {result && <InvoiceValidationResults result={result} personas={personas} />}
    </section>
  );
}
