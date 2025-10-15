import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  id: string;
  title: string;
  description: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    // Validate query parameter
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing search query' },
        { status: 400 }
      );
    }

    // Simulate database/search service call
    const mockResults: SearchResult[] = Array.from({ length: 5 }, (_, i) => ({
      id: `${i + 1}`,
      title: `Result ${i + 1} for ${query}`,
      description: `Description for result ${i + 1} related to ${query}`,
    }));

    // Simulate delay for realistic loading state
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ results: mockResults });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
