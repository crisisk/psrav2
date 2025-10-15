import { NextResponse, type NextRequest } from 'next/server';
import { z, ZodError } from 'zod';
import { generatePdf } from '@/lib/pdf-generator';
import { db } from '@/lib/database';

const ExportSchema = {
  body: z.object({
    assessmentId: z.string().min(1, 'Assessment ID is required'),
    format: z.enum(['pdf', 'csv']).default('pdf')
  })
};

export async function POST(req: NextRequest) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method Not Allowed' },
        { status: 405 }
      );
    }

    // Parse and validate request body
    const { assessmentId, format } = ExportSchema.body.parse(await req.json());

    // Fetch assessment data
    // TODO: Replace with actual database query
    const assessment = await (db as any).assessment?.findUnique({
      where: { id: assessmentId },
      include: { documents: true }
    }) || { id: assessmentId, documents: [] };

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Generate file based on format
    let fileBuffer: Buffer;
    let fileName: string;
    
    if (format === 'pdf') {
      fileBuffer = await generatePdf(assessment);
      fileName = `conformity-assessment-${assessment.id}.pdf`;
    } else {
      // CSV generation logic placeholder
      fileBuffer = Buffer.from('CSV Placeholder');
      fileName = `conformity-assessment-${assessment.id}.csv`;
    }

    // Create response with file
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': format === 'pdf' ? 'application/pdf' : 'text/csv',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      }
    });

  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    // Handle other errors
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
