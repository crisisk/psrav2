import { PencilIcon } from '@heroicons/react/24/outline';

interface DocumentationSectionProps {
  title: string;
  children: React.ReactNode;
}

export function DocumentationSection({ title, children }: DocumentationSectionProps) {
  return (
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            className="text-teal-600 hover:text-teal-700 transition-colors"
            aria-label={`Edit ${title} section`}
          >
            <PencilIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="text-gray-600">{children}</div>
    </div>
  );
}
