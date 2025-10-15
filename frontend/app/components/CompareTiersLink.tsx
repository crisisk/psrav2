import Link from 'next/link';

export default function CompareTiersLink() {
  return (
    <div className="mt-6">
      <Link
        href="/compare-tiers"
        className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-semibold flex items-center gap-2"
        aria-label="Compare all compliance tiers"
      >
        <span>Compare All Tiers</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 5l7 7-7 7M5 5l7 7-7 7"
          />
        </svg>
      </Link>
    </div>
  );
}
