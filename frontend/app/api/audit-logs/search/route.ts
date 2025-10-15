import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AuditLog } from '@/lib/audit-logs';

interface SearchResponse {
  results: AuditLog[];
  error?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('query');

    if (!searchTerm?.trim()) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    const results = await prisma.auditLog.findMany({
      where: {
        OR: [
          { certificate_number: { contains: searchTerm, mode: 'insensitive' } },
          { product_name: { contains: searchTerm, mode: 'insensitive' } },
          { supplier_name: { contains: searchTerm, mode: 'insensitive' } },
          { origin_country: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json({ results } satisfies SearchResponse);
  } catch (error) {
    console.error('[SEARCH_ERROR]', error);
    return NextResponse.json(
      { results: [], error: 'Internal server error' } satisfies SearchResponse,
      { status: 500 }
    );
  }
}
