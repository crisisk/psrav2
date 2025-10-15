import { NextResponse } from 'next/server';
import { z } from 'zod';

enum CertificateStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
  RENEWED = 'RENEWED'
}

const allowedTransitions: Record<CertificateStatus, CertificateStatus[]> = {
  [CertificateStatus.DRAFT]: [CertificateStatus.ISSUED],
  [CertificateStatus.ISSUED]: [CertificateStatus.REVOKED, CertificateStatus.EXPIRED, CertificateStatus.RENEWED],
  [CertificateStatus.REVOKED]: [CertificateStatus.RENEWED],
  [CertificateStatus.EXPIRED]: [CertificateStatus.RENEWED],
  [CertificateStatus.RENEWED]: [CertificateStatus.EXPIRED, CertificateStatus.REVOKED]
};

const requestSchema = z.object({
  newStatus: z.nativeEnum(CertificateStatus)
});

type ErrorResponse = {
  error: string;
};

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<{ success: boolean } | ErrorResponse>> {
  try {
    // Validate request body
    const rawBody = await request.json();
    const validationResult = requestSchema.safeParse(rawBody);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { newStatus } = validationResult.data;
    const certificateId = params.id;

    // In real implementation, fetch current status from database
    // Mocking current status for demonstration
    const currentStatus = CertificateStatus.ISSUED;

    // Validate status transition
    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentStatus} to ${newStatus}` },
        { status: 400 }
      );
    }

    // In real implementation, update status in database here
    
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Certificate status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
