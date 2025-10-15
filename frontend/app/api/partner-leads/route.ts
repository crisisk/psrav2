import { NextResponse } from 'next/server';
import { PartnerLead, PartnerLeadCreateDTO, PartnerLeadUpdateDTO } from '@/lib/types/partnerLead';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSchema = z.object({
  companyName: z.string().min(2),
  contactName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  website: z.string().url().optional(),
});

// GET all partner leads
export async function GET() {
  try {
    const leads = await prisma.partnerLead.findMany();
    return NextResponse.json(leads);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch partner leads' },
      { status: 500 }
    );
  }
}

// POST new partner lead
export async function POST(request: Request) {
  try {
    const body: PartnerLeadCreateDTO = await request.json();
    const validation = createSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const newLead = await prisma.partnerLead.create({
      data: {
        ...body,
        status: 'pending',
      },
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create partner lead' },
      { status: 500 }
    );
  }
}

// PUT update partner lead
export async function PUT(request: Request) {
  try {
    const { id, ...data }: PartnerLeadUpdateDTO & { id: string } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing partner lead ID' },
        { status: 400 }
      );
    }

    const updatedLead = await prisma.partnerLead.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update partner lead' },
      { status: 500 }
    );
  }
}