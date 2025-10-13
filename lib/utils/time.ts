const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat('nl-NL', {
  numeric: 'auto'
});

const RANGES: Array<{ limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2629800, divisor: 604800, unit: 'week' },
  { limit: 31557600, divisor: 2629800, unit: 'month' },
  { limit: Number.POSITIVE_INFINITY, divisor: 31557600, unit: 'year' }
];

/**
 * Format the distance between the provided date and now using Dutch relative timing semantics.
 */
export function formatRelativeTimeFromNow(date: Date): string {
  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  for (const range of RANGES) {
    if (absSeconds < range.limit) {
      const value = Math.round(diffSeconds / range.divisor) || 0;
      return RELATIVE_TIME_FORMATTER.format(value, range.unit);
    }
  }

  return RELATIVE_TIME_FORMATTER.format(0, 'second');
}
