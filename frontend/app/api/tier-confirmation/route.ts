import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const requestSchema = z.object({
  tier: z.string().min(1, 'Tier is required'),
  email: z.string().email('Invalid email address'),
  assessmentId: z.string().min(1, 'Assessment ID is required'),
});

function getEmailTemplateHtml(tier: string, assessmentId: string): string {
  return `
  <div class="font-sans p-4 bg-white">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Conformity Assessment Tier Confirmation</h1>
    <p class="text-gray-700">
      Your assessment <span class="font-semibold">${assessmentId}</span> has been
      successfully confirmed for <span class="text-blue-600 font-medium">Tier ${tier}</span>.
    </p>
    <p class="mt-4 text-gray-600 text-sm">
      This confirmation is valid for 30 days from the date of issue.
    </p>
  </div>
`;
}

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const { tier, email, assessmentId } = validation.data;

    // Send confirmation email
    const { data, error } = await resend.emails.send({
      from: 'Conformity Assessments <assessments@example.com>',
      to: email,
      subject: `Tier ${tier} Confirmation for Assessment ${assessmentId}`,
      html: getEmailTemplateHtml(tier, assessmentId),
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { message: 'Confirmation email sent successfully', data },
      { status: 200 }
    );

  } catch (error) {
    console.error('Tier confirmation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send confirmation email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
