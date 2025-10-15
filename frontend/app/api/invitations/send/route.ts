import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  email: z.string().email(),
  invitationLink: z.string().url(),
  senderName: z.string().min(1),
});

function getInvitationEmailHtml(senderName: string, invitationLink: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>You're Invited</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px;">
          <h1 style="color: #333;">You're Invited!</h1>
          <p style="color: #666; font-size: 16px; line-height: 1.5;">
            ${senderName} has invited you to join the Conformity Assessment Tracker platform.
          </p>
          <a href="${invitationLink}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 4px;">
            Accept Invitation
          </a>
          <p style="color: #999; font-size: 14px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, invitationLink, senderName } = validationResult.data;

    const emailHtml = getInvitationEmailHtml(senderName, invitationLink);

    const { data, error } = await resend.emails.send({
      from: 'invitations@conformitytracker.com',
      to: email,
      subject: `You're invited to join Conformity Assessment Tracker`,
      html: emailHtml,
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to send invitation email', details: error },
      { status: 500 }
    );
  }
}
