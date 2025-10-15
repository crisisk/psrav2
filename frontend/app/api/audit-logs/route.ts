import { NextResponse } from 'next/server';
import { getServerSession, authOptions } from '@/lib/auth';
import { AuditLog } from '@/lib/types';

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: { ids: string[] } = await request.json();
    
    if (!body.ids || !Array.isArray(body.ids)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Simulate database deletion - replace with actual DB logic
    const deletedLogs: AuditLog[] = body.ids.map(id => ({
      id,
      userId: session.user?.id,
      action: 'DELETE',
      timestamp: new Date(),
      entityId: '1',
      entityType: 'AUDIT_LOG',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    return NextResponse.json(
      { deletedCount: deletedLogs.length, logs: deletedLogs },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AUDIT_LOG_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
