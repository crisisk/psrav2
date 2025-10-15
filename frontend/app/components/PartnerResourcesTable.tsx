// Interface for partner resource data
interface PartnerResource {
  id: string;
  name: string;
  url: string;
  created_at: string;
  updated_at: string;
  category: string;
}

export default async function PartnerResourcesTable() {
  let data: PartnerResource[] = [];
  let error = '';

  try {
    // Fetch data from API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/partner-resources`, {
      next: { tags: ['partner-resources'] },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data = await response.json();
  } catch (err) {
    console.error('Failed to fetch partner resources:', err);
    error = 'Failed to load partner resources. Please try again later.';
  }

  return (
    <div className="rounded-lg border border-gray-200 shadow-sm">
      {error ? (
        <div className="p-4 text-red-500 bg-red-50">{error}</div>
      ) : (
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((resource) => (
              <tr key={resource.id}>
                <td className="px-6 py-4 whitespace-nowrap">{resource.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {resource.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900"
                  >
                    {new URL(resource.url).hostname}
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(resource.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
