import { NextResponse, NextRequest } from 'next/server';

/**
 * Documentation item interface
 */
interface DocumentationItem {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  lastUpdated: string;
  content: string;
}

/**
 * API response structure
 */
interface ApiResponse {
  success: boolean;
  data?: DocumentationItem[];
  error?: string;
}

export async function GET(request: NextRequest) {
  try {
    // Simulated data - replace with actual data source in production
    const documentationData: DocumentationItem[] = [
      {
        id: '1',
        title: 'Assessment Procedure',
        category: 'Process Documentation',
        status: 'published',
        lastUpdated: '2024-03-15',
        content: 'Detailed assessment procedure documentation...'
      },
      {
        id: '2',
        title: 'Compliance Checklist',
        category: 'Reference Materials',
        status: 'review',
        lastUpdated: '2024-03-14',
        content: 'Comprehensive compliance checklist...'
      }
    ];

    return NextResponse.json<ApiResponse>({
      success: true,
      data: documentationData
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('[DOCUMENTATION_API_ERROR]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Internal server error'
    }, {
      status: 500
    });
  }
}
