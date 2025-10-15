import type { NextAuthOptions } from 'next-auth';

// Stub authOptions for compilation
export const authOptions: NextAuthOptions = {
  providers: [],
  secret: process.env.NEXTAUTH_SECRET,
};
