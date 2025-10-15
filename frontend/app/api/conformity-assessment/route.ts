import { NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
});

// Mock data generator for demonstration
function generateMockData(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    assessmentId: `CA-${1000 + i}`,
    status: ['Pending', 'Completed', 'In Review'][i % 3],
    dueDate: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
  }));
}

const mockData = generateMockData(145); // 145 mock items

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = querySchema.parse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    });

    const { page, pageSize } = query;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    const paginatedData = mockData.slice(start, end);
    const totalItems = mockData.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        pageSize,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}