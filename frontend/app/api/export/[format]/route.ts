import { NextRequest } from 'next/server';
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify';
import PDFDocument from 'pdfkit';

// Type definitions for allowed export formats
type ExportFormat = 'xlsx' | 'csv' | 'pdf';

// Sample data structure - replace with actual data source in production
interface AssessmentData {
  id: string;
  name: string;
  status: string;
  date: string;
}

const sampleData: AssessmentData[] = [
  { id: '1', name: 'Assessment 1', status: 'Completed', date: '2024-01-15' },
  { id: '2', name: 'Assessment 2', status: 'Pending', date: '2024-02-20' },
];

export async function GET(request: NextRequest, { params }: { params: { format: string } }) {
  const format = params.format.toLowerCase() as ExportFormat;

  // Validate format parameter
  if (!['xlsx', 'csv', 'pdf'].includes(format)) {
    return new Response('Invalid export format', { 
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    // Common headers
    const headers = new Headers();

    switch (format) {
      case 'xlsx': {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Assessments');
        
        // Add headers
        worksheet.addRow(['ID', 'Name', 'Status', 'Date']);
        
        // Add data
        sampleData.forEach(item => {
          worksheet.addRow([item.id, item.name, item.status, item.date]);
        });

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        headers.set('Content-Disposition', 'attachment; filename="assessments.xlsx"');
        return new Response(buffer, { headers });
      }

      case 'csv': {
        // Convert data to CSV format
        const csvData = await new Promise<string>((resolve, reject) => {
          stringify(
            [['ID', 'Name', 'Status', 'Date'], ...sampleData.map(item => [item.id, item.name, item.status, item.date])],
            (err, output) => {
              if (err) reject(err);
              else resolve(output);
            }
          );
        });

        headers.set('Content-Type', 'text/csv');
        headers.set('Content-Disposition', 'attachment; filename="assessments.csv"');
        return new Response(csvData, { headers });
      }

      case 'pdf': {
        // Create PDF document
        const doc = new PDFDocument();
        const chunks: Uint8Array[] = [];
        
        doc.on('data', (chunk) => chunks.push(chunk));
        const pdfPromise = new Promise<Buffer>((resolve) => {
          doc.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // Add content
        doc.fontSize(16).text('Conformity Assessments', { align: 'center' });
        doc.moveDown();
        
        sampleData.forEach((item, index) => {
          doc.fontSize(12)
            .text(`${index + 1}. ${item.name}`)
            .text(`Status: ${item.status}`)
            .text(`Date: ${item.date}`)
            .moveDown();
        });

        doc.end();

        headers.set('Content-Type', 'application/pdf');
        headers.set('Content-Disposition', 'attachment; filename="assessments.pdf"');
        return new Response(await pdfPromise as unknown as BodyInit, { headers });
      }
    }
  } catch (error) {
    console.error('Export error:', error);
    return new Response('Failed to generate export', {
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
