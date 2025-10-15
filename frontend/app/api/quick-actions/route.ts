import { NextResponse } from 'next/server';

type ActionRequest = {
  action: 'export-pdf' | 'send-reminders' | 'generate-report' | 'request-review';
};

const validActions: ActionRequest['action'][] = [
  'export-pdf',
  'send-reminders',
  'generate-report',
  'request-review',
];

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object' || !('action' in body)) {
      return NextResponse.json(
        { error: 'Missing action parameter' },
        { status: 400 }
      );
    }

    const { action } = body as { action: string };

    if (!validActions.includes(action as ActionRequest['action'])) {
      return NextResponse.json(
        { error: 'Invalid action specified' },
        { status: 400 }
      );
    }

    // Simulate action processing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return action-specific response
    const messages: Record<ActionRequest['action'], string> = {
      'export-pdf': 'PDF export initiated. You will receive an email shortly.',
      'send-reminders': 'Reminders sent to all pending assessors.',
      'generate-report': 'Monthly report generated and saved to documents.',
      'request-review': 'Review request sent to quality manager.',
    };

    return NextResponse.json({
      message: messages[action as ActionRequest['action']],
    });
  } catch (error) {
    console.error('Quick Actions API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
