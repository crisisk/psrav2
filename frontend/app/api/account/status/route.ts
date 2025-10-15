import { getServerSession } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export interface AccountStatusResponse {
  status: 'active' | 'suspended' | 'pending';
  statusUpdatedAt: string;
  emailVerified: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated session
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // In real implementation, this would come from your database
    const mockUserData: AccountStatusResponse = {
      status: 'active',
      statusUpdatedAt: new Date().toISOString(),
      emailVerified: true,
    };

    return NextResponse.json(mockUserData);
  } catch (error) {
    console.error('Account status check failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
