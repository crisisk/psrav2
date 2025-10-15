import React from 'react';

interface Country {
  code: string;
  name: string;
  region?: string | null;
}

export async function CountriesTable() {
  let countries: Country[] = [];
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/countries`, {
      next: { tags: ['countries'] }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch countries');
    }

    countries = await response.json();
  } catch (error) {
    console.error('Failed to load countries:', error);
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded">
        Error loading countries list. Please try again later.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Region</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {countries.map((country) => (
            <tr key={country.code}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{country.code}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{country.name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{country.region || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
