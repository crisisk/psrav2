import { NextRequest, NextResponse } from 'next/server';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface CsvRow {
  productId: string;
  standardId: string;
  certificateExpiry: string;
  [key: string]: string;
}

interface ValidationResult {
  rowNumber: number;
  data: CsvRow;
  status: 'success' | 'failure';
  errors: string[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file' },
        { status: 400 }
      );
    }

    const results: ValidationResult[] = [];
    const stream = Readable.fromWeb(file.stream() as any);
    let rowNumber = 0;

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data: CsvRow) => {
          rowNumber++;
          const errors: string[] = [];

          // Validate required fields
          if (!data.productId) errors.push('Missing productId');
          if (!data.standardId) errors.push('Missing standardId');
          if (!data.certificateExpiry) errors.push('Missing certificateExpiry');

          // Add custom validation rules here

          results.push({
            rowNumber,
            data,
            status: errors.length === 0 ? 'success' : 'failure',
            errors
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });

    return NextResponse.json({
      success: true,
      totalRows: rowNumber,
      validRows: results.filter(r => r.status === 'success').length,
      invalidRows: results.filter(r => r.status === 'failure').length,
      results
    });

  } catch (error) {
    console.error('CSV validation error:', error);
    return NextResponse.json(
      { error: 'Failed to process CSV file' },
      { status: 500 }
    );
  }
}

// Type helper for API response
export type ValidationApiResponse = {
  success: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  results: ValidationResult[];
} | {
  error: string;
};