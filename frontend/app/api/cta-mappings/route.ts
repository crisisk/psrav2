import { NextResponse } from 'next/server';
import { z } from 'zod';
import mockDb from '@/lib/mockDb';
import type { CtaMapping, ErrorResponse } from '@/types/cta';

const CtaSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  actionType: z.string().min(1, 'Action type is required'),
  configuration: z.record(z.unknown())
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = CtaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json<ErrorResponse>({
        error: 'Validation Error',
        message: validation.error.errors[0].message
      }, { status: 400 });
    }

    const newCta = mockDb.createOrUpdate({
      ...validation.data,
      configuration: validation.data.configuration || {}
    });

    return NextResponse.json<CtaMapping>(newCta, { status: 201 });
  } catch (error) {
    return NextResponse.json<ErrorResponse>({
      error: 'Internal Server Error',
      message: 'Failed to create CTA mapping'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const ctas = mockDb.getAll();
    return NextResponse.json<CtaMapping[]>(ctas);
  } catch (error) {
    return NextResponse.json<ErrorResponse>({
      error: 'Internal Server Error',
      message: 'Failed to fetch CTA mappings'
    }, { status: 500 });
  }
}
