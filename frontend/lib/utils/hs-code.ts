/**
 * HS Code utilities for PSRA-LTSD
 * Harmonized System (HS) code validation and lookup
 */

export interface HSCode {
  code: string;
  description: string;
  chapter: string;
  section: string;
}

export function validateHSCode(code: string): boolean {
  // HS codes are typically 6-10 digits
  const cleanCode = code.replace(/[^\d]/g, '');
  return cleanCode.length >= 6 && cleanCode.length <= 10;
}

export function formatHSCode(code: string): string {
  const cleanCode = code.replace(/[^\d]/g, '');
  // Format as XX.XX.XX.XX
  if (cleanCode.length >= 6) {
    return `${cleanCode.slice(0, 2)}.${cleanCode.slice(2, 4)}.${cleanCode.slice(4, 6)}` +
      (cleanCode.length > 6 ? `.${cleanCode.slice(6)}` : '');
  }
  return cleanCode;
}

export function parseHSCode(code: string): { chapter: string; heading: string; subheading: string } {
  const cleanCode = code.replace(/[^\d]/g, '');
  return {
    chapter: cleanCode.slice(0, 2),
    heading: cleanCode.slice(2, 4),
    subheading: cleanCode.slice(4, 6)
  };
}

export async function lookupHSCode(code: string): Promise<HSCode | null> {
  // Mock implementation - in production, query TARIC database
  console.log('[HS Code Lookup]', code);
  return null;
}

export default {
  validate: validateHSCode,
  format: formatHSCode,
  parse: parseHSCode,
  lookup: lookupHSCode
};


/**
 * Validate HS code format
 * @param hsCode - HS code string
 * @returns True if valid HS code format
 */
export function isValidHsCode(hsCode: string): boolean {
  // HS codes are typically 4-10 digits
  const cleaned = hsCode.replace(/[^0-9]/g, '');
  return cleaned.length >= 4 && cleaned.length <= 10;
}


/**
 * Normalize HS code format (remove spaces, dots, dashes)
 */
export function normalizeHsCode(hsCode: string): string {
  return hsCode.replace(/[^0-9]/g, '');
}
