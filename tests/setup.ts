import { afterAll, vi } from 'vitest';

// Mock the database layer to avoid real connections during tests.
vi.mock('@/lib/db', () => ({
  query: vi.fn(async () => {
    throw new Error('Database unavailable in test environment');
  }),
}));

// Ensure predictable time-based behaviour in tests when needed.
vi.useFakeTimers();
vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

afterAll(() => {
  vi.useRealTimers();
});
