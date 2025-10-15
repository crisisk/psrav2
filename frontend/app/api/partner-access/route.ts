import { NextRequest, NextResponse } from 'next/server';
import { sendEmailNotification } from '@/lib/email';

interface PartnerAccessRequest {
  name: string;
  email: string;
  company: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PartnerAccessRequest = await request.json();

    // Validation
    if (!body.name || !body.email || !body.company) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Simulate email sending
    await sendEmailNotification({
      to: 'admin@example.com', // Placeholder for admin email
      subject: 'New Partner Access Request',
      text: `Name: ${body.name}\nCompany: ${body.company}\nEmail: ${body.email}\nMessage: ${body.message || 'No message provided'}`
    });

    return NextResponse.json(
      { message: 'Access request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Partner access request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
