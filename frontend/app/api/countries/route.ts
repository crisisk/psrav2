import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: 'asc' },
      select: {
        code: true,
        name: true,
        region: true
      }
    });

    return NextResponse.json(countries);
  } catch (error) {
    console.error('[COUNTRIES_API]', error);
    return NextResponse.json(
      { message: 'Failed to fetch countries' },
      { status: 500 }
    );
  }
}
