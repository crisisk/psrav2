import Link from 'next/link';
import { type ReactElement } from 'react';

type AISystemCardProps = {
  id: string;
  name: string;
  description: string;
};

export function AISystemCard({
  id,
  name,
  description,
}: AISystemCardProps): ReactElement {
  return (
    <Link
      href={`/documentation-generator/${id}`}
      className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg
                 transition-shadow duration-200 border border-gray-200
                 hover:border-blue-500"
      data-testid="ai-system-card"
    >
      <h3 className="text-xl font-semibold mb-2 text-gray-800">{name}</h3>
      <p className="text-gray-600 line-clamp-3">{description}</p>
    </Link>
  );
}
