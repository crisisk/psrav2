import type { BomLineItem } from '@/lib/invoice-validator';

export interface CsvParseOutcome {
  items: BomLineItem[];
  error?: string;
}

function detectDelimiter(header: string) {
  const commaSegments = header.split(',').length;
  const semicolonSegments = header.split(';').length;
  return semicolonSegments > commaSegments ? ';' : ',';
}

function sanitise(value: string | undefined) {
  return (value ?? '').replace(/^"|"$/g, '').trim();
}

function parseDecimal(input: string | undefined, fallback: number) {
  if (!input) {
    return fallback;
  }
  const normalised = input.replace(/[^0-9,.-]/g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalised);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export async function parseInvoiceCsv(file: File): Promise<CsvParseOutcome> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : new TextDecoder().decode(reader.result as ArrayBuffer);
      const rows = text
        .split(/\r?\n/)
        .map(row => row.trim())
        .filter(Boolean);

      if (rows.length <= 1) {
        resolve({ items: [], error: 'Geen gegevens gevonden in het CSV-bestand.' });
        return;
      }

      const delimiter = detectDelimiter(rows[0]);
      const parsedRows = rows.map(row => row.split(delimiter).map(sanitise));
      const [, ...dataRows] = parsedRows;

      const items: BomLineItem[] = dataRows
        .map(columns => {
          const [sku = '', description = '', hsCode = '', value = '0', quantity = '1', country = ''] = columns;
          return {
            sku: sanitise(sku),
            description: sanitise(description),
            hsCode: sanitise(hsCode),
            value: parseDecimal(value, 0),
            quantity: parseDecimal(quantity, 1),
            countryOfOrigin: sanitise(country) || undefined,
          } satisfies BomLineItem;
        })
        .filter(item => item.sku.length > 0 && item.description.length > 0);

      resolve({ items });
    };

    reader.onerror = () => {
      resolve({ items: [], error: 'Het bestand kon niet worden gelezen. Controleer permissies of formaat.' });
    };

    reader.readAsText(file, 'utf-8');
  });
}
