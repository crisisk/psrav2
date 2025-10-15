'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';

// Displays current authentication status with Azure AD
export default function AzureAuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
        Loading authentication status...
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      {session ? (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Authenticated with Azure AD</h2>
          <p className="text-gray-600">
            Logged in as: {session.user?.name} ({session.user?.email})
          </p>
          <Link
            href="/api/auth/signout"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign Out
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Not Authenticated</h2>
          <Link
            href="/api/auth/signin"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Sign In with Azure AD
          </Link>
        </div>
      )}
    </div>
  );
}
