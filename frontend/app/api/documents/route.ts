import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

// Type definitions for document metadata
interface DocumentMetadata {
  id: string;
  title: string;
  description: string;
  uploadedAt: Date;
  fileSize: number;
}

// Validation schema for document upload
const DocumentSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  file: z.instanceof(File).refine(file => file.size < 10_000_000, 'File size must be less than 10MB')
});

export async function GET() {
  try {
    // Simulated database fetch
    const mockDocuments: DocumentMetadata[] = [
      {
        id: '1',
        title: 'Example Document',
        description: 'Sample compliance checklist',
        uploadedAt: new Date(),
        fileSize: 1024
      }
    ];

    return NextResponse.json(mockDocuments, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Validate form data
    const validationResult = DocumentSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      file: formData.get('file')
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Process file upload here (simulated)
    const { title, description, file } = validationResult.data;
    
    // Return simulated response
    return NextResponse.json(
      {
        id: '2',
        title,
        description,
        uploadedAt: new Date(),
        fileSize: file.size
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Document upload failed' },
      { status: 500 }
    );
  }
}
