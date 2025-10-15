/**
 * Session management utilities for PSRA-LTSD
 */

export async function getSession() {
  // Stub session for build - replace with actual auth in production
  return { user: { id: 'stub-user' } };
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

export async function getUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

export function isAuthenticated(session: any): boolean {
  return !!session?.user;
}
export const getCurrentUser = async (): Promise<any> => { return null; };
