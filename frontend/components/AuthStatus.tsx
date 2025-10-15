// Client component for authentication status
'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="p-4 text-gray-500">
        Loading authentication status...
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 bg-white shadow-md">
      {session ? (
        <>
          <span className="text-sm text-gray-600">
            Signed in as {session.user?.name}
          </span>
          <button
            onClick={() => signOut()}
            className="px-3 py-1 text-sm text-red-600 border border-red-500 rounded hover:bg-red-50"
          >
            Sign out
          </button>
        </>
      ) : (
        <button
          onClick={() => signIn('azure-ad')}
          className="px-3 py-1 text-sm text-blue-600 border border-blue-500 rounded hover:bg-blue-50"
        >
          Sign in with Azure AD
        </button>
      )}
    </div>
  );
}
