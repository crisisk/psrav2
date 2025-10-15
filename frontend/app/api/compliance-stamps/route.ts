import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Type definition for compliance stamp
interface ComplianceStamp {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Mock database (replace with real database in production)
let complianceStamps: ComplianceStamp[] = [
  {
    id: '1',
    name: 'ISO Certified',
    description: 'Meets ISO 9001 standards',
    color: '#3b82f6',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Validation schema
const stampSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'),
});

export async function GET() {
  try {
    return NextResponse.json(complianceStamps);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch compliance stamps' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = stampSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const newStamp: ComplianceStamp = {
      id: Math.random().toString(36).substr(2, 9),
      ...validation.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    complianceStamps.push(newStamp);
    return NextResponse.json(newStamp, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create compliance stamp' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    const validation = stampSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const index = complianceStamps.findIndex((stamp) => stamp.id === id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Compliance stamp not found' },
        { status: 404 }
      );
    }

    const updatedStamp = {
      ...complianceStamps[index],
      ...validation.data,
      updatedAt: new Date(),
    };
    complianceStamps[index] = updatedStamp;
    return NextResponse.json(updatedStamp);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update compliance stamp' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    complianceStamps = complianceStamps.filter((stamp) => stamp.id !== id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete compliance stamp' },
      { status: 500 }
    );
  }
}
