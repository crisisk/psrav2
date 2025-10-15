import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const result = await prisma.auditLog.groupBy({
      by: ['customerId'],
      _count: {
        _all: true
      },
      orderBy: {
        customerId: 'asc'
      }
    });

    const formattedData = result.map((item: any) => ({
      customerId: item.customerId,
      count: item._count._all
    }));

    return NextResponse.json({ data: formattedData }, { status: 200 });
  } catch (error) {
    console.error('Customer breakdown fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve audit log breakdown' },
      { status: 500 }
    );
  }
}
