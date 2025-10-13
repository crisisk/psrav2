// API proxy utility
const API_BASE_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function shouldUseMock(): boolean {
  return process.env.USE_MOCK === 'true' || !API_BASE_URL;
}

export async function proxyRequest(path: string, options?: RequestInit) {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL is not configured');
  }

  const url = `${API_BASE_URL}${path}`;
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}
