import { NextRequest, NextResponse } from 'next/server';
import CertificateService from '@/lib/services/certificateService';

type BulkActionBody = {
  ids: string[];
};

export async function POST(req: NextRequest) {
  try {
    const { ids }: BulkActionBody = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or empty certificate IDs' },
        { status: 400 }
      );
    }

    // Extract user ID from session (placeholder - implement actual auth)
    const userId = 'system-user-id';

    const pathSegments = req.nextUrl.pathname.split('/');
    const action = pathSegments[pathSegments.length - 1];

    switch (action) {
      case 'approve':
        await CertificateService.bulkApprove(userId, ids);
        break;
      case 'reject':
        await CertificateService.bulkReject(userId, ids);
        break;
      case 'delete':
        await CertificateService.bulkDelete(userId, ids);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid bulk action' },
          { status: 400 }
        );
    }

    return NextResponse.json(
      { success: true, message: 'Bulk operation completed' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk operation failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
