import { NextResponse } from 'next/server';
import { z } from 'zod';

type ComplianceEntry = {
  id: string;
  reference: string;
  regulation: string;
  status: 'compliant' | 'non-compliant' | 'in-review';
  dueDate: string;
  lastUpdated: string;
};

const mockData: ComplianceEntry[] = [
  {
    id: '1',
    reference: 'CBAM-2024-001',
    regulation: 'EU CBAM 2023',
    status: 'in-review',
    dueDate: '2024-12-31',
    lastUpdated: '2024-03-15'
  }
];

const entrySchema = z.object({
  reference: z.string().min(5),
  regulation: z.string().min(3),
  status: z.enum(['compliant', 'non-compliant', 'in-review']),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export async function GET() {
  try {
    return NextResponse.json({ data: mockData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = entrySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 }
      );
    }

    const newEntry: ComplianceEntry = {
      ...validation.data,
      id: Date.now().toString(),
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    mockData.push(newEntry);
    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
