import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { User } from '@/lib/types';

// Zod schema for user validation
const CreateUserSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  role: z.enum(['USER', 'ADMIN', 'AUDITOR']),
});

export async function GET() {
  try {
    // Mock data - replace with actual database query
    const mockUsers: User[] = [
      { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'ADMIN' },
      { id: '2', name: 'Regular User', email: 'user@example.com', role: 'USER' },
    ];
    return NextResponse.json(mockUsers, { status: 200 });
  } catch (error) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    
    // Validate request body
    const body = CreateUserSchema.parse(json);

    // Create user in database
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { errors: error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    console.error('User creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
