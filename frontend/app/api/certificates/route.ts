import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Type definitions for API responses
type CertificateResponse = {
  success: boolean;
  message: string;
  certificateId?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json<CertificateResponse>({
        success: false,
        message: 'Method not allowed'
      }, { status: 405 });
    }

    // Simulate certificate creation - replace with actual database logic
    const newCertificate = {
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json<CertificateResponse>({
      success: true,
      message: 'Certificate created successfully',
      certificateId: newCertificate.id
    }, { status: 201 });

  } catch (error) {
    console.error('[CERTIFICATES_POST]', error);
    return NextResponse.json<CertificateResponse>({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
