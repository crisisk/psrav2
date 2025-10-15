import { UsersTable } from '@/components/UsersTable';

export default async function UsersPage() {
  // Server-side initial fetch
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
    cache: 'no-store'
  });
  const initialUsers = await response.json();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold leading-tight text-gray-900">User Accounts</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all registered user accounts in the system
          </p>
        </div>
      </div>
      <UsersTable users={initialUsers} />
    </div>
  );
}
