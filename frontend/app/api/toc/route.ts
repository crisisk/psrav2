import { NextResponse } from 'next/server';

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export async function GET() {
  try {
    // Simulate data fetching from CMS or content source
    const tocData: TOCItem[] = [
      { id: 'overview', text: 'Overview', level: 1 },
      { id: 'requirements', text: 'Key Requirements', level: 2 },
      { id: 'process', text: 'Assessment Process', level: 2 },
      { id: 'timeline', text: 'Implementation Timeline', level: 1 },
    ];

    return NextResponse.json(tocData, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve table of contents' },
      { status: 500 }
    );
  }
}