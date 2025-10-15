import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Validate document ID format
    if (!documentId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid document ID format' },
        { status: 400 }
      );
    }

    // Check if document exists
    const existingDocument = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!existingDocument) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Perform cascading delete in transaction
    const result = await prisma.$transaction([
      prisma.historyEntry.deleteMany({
        where: { documentId },
      }),
      prisma.auditLog.deleteMany({
        where: { documentId },
      }),
      prisma.document.delete({
        where: { id: documentId },
      }),
    ]);

    return NextResponse.json({
      success: true,
      deletedCount: result.length,
    });

  } catch (error) {
    console.error('[CASCADE_DELETE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
