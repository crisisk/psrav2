import { NextResponse } from 'next/server';
import { sendPartnerManagerNotification } from '@/lib/notifications';
import { z } from 'zod';

const schema = z.object({
  stage: z.enum(['Qualified', 'Won'])
});

export async function POST(
  request: Request,
  { params }: { params: { dealId: string } }
) {
  try {
    const { dealId } = params;
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { stage } = validation.data;

    // In real implementation, fetch partner manager from database
    const partnerManager = {
      email: 'partner.manager@example.com',
      name: 'Partner Manager'
    };

    await sendPartnerManagerNotification({
      dealId,
      stage,
      partnerManagerEmail: partnerManager.email,
      partnerManagerName: partnerManager.name
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${partnerManager.email}`
    });
  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
