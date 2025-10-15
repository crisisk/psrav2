import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { CustomerCreateSchema } from '@/lib/validations/customer';



export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedData = CustomerCreateSchema.parse(body);

    // Create customer in database
    const newCustomer = await db.customer.create({
      data: validatedData
    });

    return NextResponse.json(
      { data: newCustomer, message: 'Customer created successfully' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }

    console.error('Customer creation error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
