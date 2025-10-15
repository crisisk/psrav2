import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
  userId: z.string().uuid('Invalid user ID'),
});

export async function POST(req: Request) {
  try {
    // Validate request body
    const rawBody = await req.json();
    const parsedBody = requestSchema.parse(rawBody);

    // Mock audit log generation - replace with actual implementation
    const csvData = 'Timestamp,Action,User\n2024-02-20T12:34:56,Login,user@example.com';
    const fileName = `audit-logs-${Date.now()}.csv`;
    // In production: Upload CSV to storage service and get download URL
    const mockDownloadUrl = `https://example.com/download/${fileName}`;

    // Send email with download link
    const { data, error } = await resend.emails.send({
      from: 'audit@example.com',
      to: parsedBody.email,
      subject: 'Your Audit Log Export is Ready',
      text: `Download your audit logs here: ${mockDownloadUrl}`,
      html: `<p>Download your audit logs here: <a href="${mockDownloadUrl}">${fileName}</a></p>`,
    });

    if (error) {
      throw new Error(`Email sending failed: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Download link sent to email',
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
