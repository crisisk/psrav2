const DIGIT_ONLY = /\D+/g;

export function normalizeHsCode(value: unknown, digits = 6): string {
  if (value === undefined || value === null) {
    return '';
  }

  const numeric = String(value).replace(DIGIT_ONLY, '');
  return numeric.slice(0, digits);
}

export function isValidHsCode(value: unknown, digits = 6): boolean {
  const normalized = normalizeHsCode(value, digits);
  return normalized.length === digits && /^\d+$/.test(normalized);
}

export function assertHsCode(value: unknown, digits = 6): string {
  const normalized = normalizeHsCode(value, digits);
  if (!isValidHsCode(normalized, digits)) {
    throw new Error(`HS code must contain exactly ${digits} digits`);
  }

  return normalized;
}
