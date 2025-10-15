// Stub for the NextAuth auth function
export async function auth() {
  // Stub session for build - replace with actual auth in production
  return { user: { id: 'stub-user', isAdmin: true } };
}
