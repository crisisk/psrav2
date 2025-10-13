import { describe, expect, it } from 'vitest';

import { assertHsCode, isValidHsCode, normalizeHsCode } from '@/lib/utils/hs-code';

describe('hs-code utils', () => {
  it('normalizes to six digits when possible', () => {
    expect(normalizeHsCode('12-34.56')).toBe('123456');
  });

  it('truncates longer codes to requested length', () => {
    expect(normalizeHsCode('123456789', 6)).toBe('123456');
  });

  it('returns empty string when no digits are provided', () => {
    expect(normalizeHsCode('abc')).toBe('');
  });

  it('detects validity for 6 digit codes', () => {
    expect(isValidHsCode('123456')).toBe(true);
    expect(isValidHsCode('12345a')).toBe(false);
  });

  it('asserts valid HS codes', () => {
    expect(assertHsCode(' 123456 ')).toBe('123456');
    expect(() => assertHsCode('12345')).toThrowError('HS code must contain exactly 6 digits');
  });
});
