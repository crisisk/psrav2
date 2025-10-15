import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  CommissionDispute,
  CreateCommissionDisputeDTO,
  UpdateCommissionDisputeDTO,
} from '@/lib/types/commissionDispute';
import { z } from 'zod';

// Zod schema for validation
const createSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  amount: z.number().positive(),
  userId: z.string().uuid(),
  commissionId: z.string().uuid(),
});

const updateSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().min(10).max(500).optional(),
  status: z.enum(['OPEN', 'IN_REVIEW', 'RESOLVED', 'CLOSED']).optional(),
  amount: z.number().positive().optional(),
});

// GET all disputes
export async function GET() {
  try {
    const disputes: CommissionDispute[] = await prisma.commissionDispute.findMany();
    return NextResponse.json(disputes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch commission disputes' },
      { status: 500 }
    );
  }
}

// CREATE new dispute
export async function POST(request: Request) {
  try {
    const body: CreateCommissionDisputeDTO = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const newDispute = await prisma.commissionDispute.create({
      data: {
        ...body,
        disputeNumber: `DISP-${Date.now().toString(16)}`,
        status: 'OPEN',
      },
    });

    return NextResponse.json(newDispute, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create commission dispute' },
      { status: 500 }
    );
  }
}

// UPDATE existing dispute
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const body: UpdateCommissionDisputeDTO = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing dispute ID' },
        { status: 400 }
      );
    }

    const validation = updateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(validation.error.errors, { status: 400 });
    }

    const updatedDispute = await prisma.commissionDispute.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(updatedDispute);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update commission dispute' },
      { status: 500 }
    );
  }
}

// DELETE dispute
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing dispute ID' },
        { status: 400 }
      );
    }

    await prisma.commissionDispute.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Dispute deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete commission dispute' },
      { status: 500 }
    );
  }
}
