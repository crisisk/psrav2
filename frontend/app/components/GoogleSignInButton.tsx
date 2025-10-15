import Link from 'next/link';

export default function GoogleSignInButton() {
  return (
    <Link
      href="/api/auth/google"
      className="flex w-full max-w-xs items-center justify-center gap-3 rounded-md bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <svg
        className="h-5 w-5"
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.019 2 2.545 6.477 2.545 12s4.474 10 10 10c5.523 0 10-4.477 10-10 0-.67-.069-1.325-.2-1.955H12.545z" />
      </svg>
      <span>Sign in with Google</span>
    </Link>
  );
}
