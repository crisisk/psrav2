import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { pdfGenerator, type CertificateData } from '@/lib/pdf-generator';
import { getCertificateById } from '@/lib/repository';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const certificate = await getCertificateById(params.id);

  if (!certificate) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const certificateData: CertificateData = {
    ...certificate,
    result: certificate.result as CertificateData['result'],
  };

  const buffer = await pdfGenerator.generateCertificate(certificateData);
  const response = new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${certificate.id}.pdf"`,
    },
  });

  return response;
}
