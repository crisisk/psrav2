import { DefaultSession } from 'next-auth';
import { UserTier } from '@/lib/permissions';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's tier. */
      id?: string;
      tier?: UserTier;
      isAdmin?: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
  }
}
