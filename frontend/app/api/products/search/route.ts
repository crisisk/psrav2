import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

type Product = {
  id: string;
  name: string;
  description: string | null;
  certification_status: string;
  created_at: Date;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('q');

  // Validate search term
  if (!searchTerm || searchTerm.trim().length < 2) {
    return NextResponse.json(
      { error: 'Search term must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    // Perform full-text search using PostgreSQL tsvector
    const results = await query<Product>(
      `SELECT id, name, description, certification_status, created_at
       FROM products
       WHERE to_tsvector('english', name || ' ' || description) @@ plainto_tsquery('english', $1)
       ORDER BY ts_rank_cd(to_tsvector('english', name || ' ' || description), plainto_tsquery('english', $1)) DESC
       LIMIT 50`,
      [searchTerm]
    );

    return NextResponse.json({ data: results.rows });
  } catch (error) {
    console.error('[SEARCH_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
