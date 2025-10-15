import { NextResponse } from 'next/server';

interface TenantRequest {
  tenantName: string;
  adminEmail: string;
  domain?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  tenantId?: string;
}

export async function POST(request: Request) {
  try {
    const body: TenantRequest = await request.json();

    // Validate required fields
    if (!body.tenantName || !body.adminEmail) {
      return NextResponse.json<ApiResponse>({
        success: false,
        message: 'Missing required fields: tenantName and adminEmail are required'
      }, { status: 400 });
    }

    // Simulate tenant creation in main platform
    // In production, this would connect to your tenant management service
    const mockTenantId = `tn_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Tenant created successfully',
      tenantId: mockTenantId
    }, { status: 201 });

  } catch (error) {
    console.error('[TENANT_API_ERROR]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}
