import Link from 'next/link';
import { cn } from '@/lib/utils';

type PaginationProps = {
  currentPage: number;
  totalPages: number;
};

export default function Pagination({
  currentPage,
  totalPages,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <nav className="flex items-center justify-between border-t border-gray-200 px-4 sm:px-0">
      <div className="flex flex-1 justify-between gap-2 sm:justify-end">
        <Link
          href={`?page=${currentPage - 1}`}
          className={cn(
            'inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md',
            currentPage === 1 &&
              'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          aria-disabled={currentPage === 1}
        >
          Previous
        </Link>

        <div className="hidden sm:flex gap-2">
          {getPageNumbers().map((page) => (
            <Link
              key={page}
              href={`?page=${page}`}
              className={cn(
                'px-4 py-2 text-sm font-medium border rounded-md',
                page === currentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300'
              )}
            >
              {page}
            </Link>
          ))}
        </div>

        <Link
          href={`?page=${currentPage + 1}`}
          className={cn(
            'inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md',
            currentPage === totalPages &&
              'opacity-50 cursor-not-allowed pointer-events-none'
          )}
          aria-disabled={currentPage === totalPages}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
