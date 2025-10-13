import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest, shouldUseMock } from '../../_lib';
import { mockAssessment } from '../../_mocks';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { format } = await request.json();

    // Validate format
    if (!['pdf', 'json', 'csv'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be pdf, json, or csv' },
        { status: 400 }
      );
    }

    // Get assessment data
    let assessment;
    if (shouldUseMock()) {
      assessment = mockAssessment;
    } else {
      const response = await proxyRequest(`/assessments/${params.id}`);
      assessment = await response.json();
    }

    // Prepare content based on format
    let content: string | Buffer;
    let contentType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(assessment, null, 2);
        contentType = 'application/json';
        break;
      
      case 'csv':
        // Simple CSV conversion - adjust fields as needed
        const headers = Object.keys(assessment).join(',');
        const values = Object.values(assessment).join(',');
        content = `${headers}\n${values}`;
        contentType = 'text/csv';
        break;
      
      case 'pdf':
        // In a real implementation, you'd use a PDF library
        // This is a placeholder that returns a simple PDF
        content = Buffer.from('%PDF-1.4\nSimple PDF Content');
        contentType = 'application/pdf';
        break;

      default:
        content = JSON.stringify(assessment, null, 2);
        contentType = 'application/json';
        break;
    }

    // Create response with appropriate headers
    const response = new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename=assessment-${params.id}.${format}`
      }
    });

    return response;

  } catch (error) {
    console.error('Error exporting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to export assessment' },
      { status: 500 }
    );
  }
}
