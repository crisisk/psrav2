import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface DisputeRequest {
  commissionId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DisputeRequest = await request.json();

    if (!body.commissionId) {
      return NextResponse.json(
        { error: 'Missing commission ID' },
        { status: 400 }
      );
    }

    // In real implementation, verify commission status from database
    // const commission = await getCommission(body.commissionId);
    // if (commission.status !== 'pending') {
    //   return NextResponse.json(
    //     { error: 'Commission is not disputable' },
    //     { status: 409 }
    //   );
    // }

    // Simulate dispute processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(
      { message: 'Dispute initiated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[COMMISSION_DISPUTE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
