import { NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';
import { type NextRequest } from 'next/server';
import { validateAuthorization } from '@/lib/auth';

type RequestBody = {
  documentType: 'ai-act-assessment';
  content: Record<string, any>;
};

type ErrorResponse = {
  error: string;
  details?: string;
};

async function generateAIActDocumentationPDF(content: Record<string, any>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      // PDF content generation
      doc.fontSize(18).text('AI Act Conformity Assessment', { align: 'center' });
      doc.moveDown();

      // Add dynamic content
      Object.entries(content).forEach(([key, value]) => {
        doc.fontSize(12)
           .text(`${key}: ${JSON.stringify(value, null, 2)}`)
           .moveDown();
      });

      doc.end();
    } catch (error) {
      reject(new Error('Failed to generate PDF document'));
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authError = await validateAuthorization(request);
    if (authError) return authError;

    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse and validate request body
    const body = (await request.json()) as RequestBody;
    if (!body.documentType || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateAIActDocumentationPDF(body.content);

    // Create response with PDF
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="ai-act-assessment-${Date.now()}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[DocumentGenerationError]', error);
    const response: ErrorResponse = {
      error: 'Failed to generate document',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    return NextResponse.json(response, { status: 500 });
  }
}
