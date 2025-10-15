import { NextResponse } from 'next/server';
import { z } from 'zod';

const LeadSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  company: z.string().min(2, 'Company must be at least 2 characters'),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = LeadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // In real implementation, replace with actual database call
    // Example: await prisma.lead.create({ data: validation.data })
    const mockLead = { ...validation.data, id: Date.now().toString() };

    return NextResponse.json(
      { data: mockLead },
      { status: 201 }
    );
  } catch (error) {
    console.error('Lead registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
