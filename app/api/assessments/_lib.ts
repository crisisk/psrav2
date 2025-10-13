// API utilities
export async function proxyRequest(path: string, options?: RequestInit) {
  const API_BASE_URL = process.env.API_BASE_URL || '';
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL not configured');
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export function shouldUseMock(): boolean {
  return !process.env.API_BASE_URL || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}
