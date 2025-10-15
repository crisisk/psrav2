import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const breakdown = await prisma.assessment.groupBy({
      by: ['customerId'],
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          customerId: 'desc'
        }
      },
      include: {
        customer: true
      }
    });

    const formattedData = breakdown.map((item: any) => ({
      customerId: item.customerId,
      count: item._count._all,
      customer: item.customer
    }));

    return NextResponse.json(formattedData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('[CONFORMITY_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
