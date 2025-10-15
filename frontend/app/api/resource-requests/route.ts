import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { ResourceRequest } from '@/lib/types';

const prisma = new PrismaClient();

// Type validation schema
interface CreateRequestDto {
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

export async function GET() {
  try {
    const requests = await prisma.resourceRequest.findMany();
    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch resource requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: CreateRequestDto = await request.json();
    
    if (!body.title || !body.description || !body.status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newRequest = await prisma.resourceRequest.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        createdAt: new Date(),
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create resource request' },
      { status: 500 }
    );
  }
}
