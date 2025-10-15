import { NextResponse } from 'next/server';

interface Supplier {
  id: string;
  name: string;
  location: string;
}

// Mock data - replace with actual database connection
const mockSuppliers: Supplier[] = [
  { id: '1', name: 'Global Parts Inc.', location: 'New York, USA' },
  { id: '2', name: 'Euro Components Ltd.', location: 'Berlin, Germany' },
  { id: '3', name: 'AsiaTech Suppliers', location: 'Tokyo, Japan' },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';

    // Validate input
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Simulate async search with debouncing
    await new Promise(resolve => setTimeout(resolve, 300));

    const filteredSuppliers = mockSuppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({ data: filteredSuppliers });
  } catch (error) {
    console.error('Supplier search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
