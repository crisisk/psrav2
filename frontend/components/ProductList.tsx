import React from 'react';

export interface Product {
  id: number;
  name: string;
  hsCode: string;
  description: string;
}

interface ProductListProps {
  query: string;
}

export async function ProductList({ query }: ProductListProps) {
  try {
    const response = await fetch(
      `/api/products?query=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data }: { data: Product[] } = await response.json();

    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No matching products found
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((product) => (
          <div
            key={product.id}
            className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{product.description}</p>
              </div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {product.hsCode}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error fetching products:', error);
    return (
      <div className="text-center py-8 text-red-500">
        Error loading products. Please try again later.
      </div>
    );
  }
}