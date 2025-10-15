import { NextRequest, NextResponse } from 'next/server';
import { IncomingForm } from 'formidable';
import { NextApiRequest } from 'next';
import fs from 'fs/promises';
import path from 'path';

type FileUploadResponse = {
  success: boolean;
  message: string;
  file?: {
    name: string;
    size: number;
    path: string;
  };
};

export async function POST(req: NextRequest) {
  const uploadDir = path.join(process.cwd(), 'public/uploads');

  try {
    // Ensure upload directory exists
    await fs.mkdir(uploadDir, { recursive: true });

    const form = new IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024 // 5MB
    });

    const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
      form.parse(req as unknown as NextApiRequest, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return NextResponse.json<FileUploadResponse>({
        success: false,
        message: 'No file uploaded'
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(uploadedFile.mimetype)) {
      await fs.unlink(uploadedFile.filepath);
      return NextResponse.json<FileUploadResponse>({
        success: false,
        message: 'Invalid file type. Only PDF, DOC, and DOCX are allowed.'
      }, { status: 400 });
    }

    // Create public URL path
    const publicPath = `/uploads/${path.basename(uploadedFile.filepath)}`;

    return NextResponse.json<FileUploadResponse>({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: uploadedFile.originalFilename || uploadedFile.newFilename,
        size: uploadedFile.size,
        path: publicPath
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json<FileUploadResponse>({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
