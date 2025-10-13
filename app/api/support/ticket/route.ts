import { NextResponse } from 'next/server';

export interface SupportTicketPayload {
  name: string;
  email: string;
  category: string;
  message: string;
  attachment?: File;
}

export async function POST(request: Request) {
  try {
    const data: SupportTicketPayload = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.category || !data.message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mock response for now
    const response = {
      ticketId: `SUPP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      status: 'created',
      message: 'Your support ticket has been created. We will get back to you shortly.',
    };

    // In production, this would forward to a ticketing system
    console.log('Support ticket created:', {
      ticketId: response.ticketId,
      category: data.category,
      email: data.email
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Support ticket creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}
