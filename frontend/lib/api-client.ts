// Stub for ApiClient with static methods
const BASE_URL = '/api';

export class ApiClient {
  static async get<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`);
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    // Assuming the response is JSON, which is common for Next.js API routes
    return response.json() as Promise<T>;
  }

  static async post<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }

  static async put<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }
    return response.json() as Promise<T>;
  }
}
