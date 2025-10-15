import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Type for API error response
type ErrorResponse = {
  error: string;
  message?: string;
};

export async function GET() {
  try {
    // Create a simple DOCX document structure
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Conformity Assessment Report',
                bold: true,
                size: 36,
              }),
            ],
          }),
        ],
      }],
    });

    // Generate DOCX buffer
    const buffer = await Packer.toBuffer(doc);

    // Create response with DOCX file
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="assessment-report.docx"',
      },
    });
  } catch (error) {
    console.error('DOCX export failed:', error);
    return NextResponse.json<ErrorResponse>({
      error: 'Export failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
