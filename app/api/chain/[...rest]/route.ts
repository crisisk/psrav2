import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockChainOverview } from '../../_lib';

export async function GET(
  request: NextRequest,
  { params }: { params: { rest: string[] } }
) {
  const path = params.rest.join('/');
  
  if (shouldUseMock()) {
    // Parse ltsdId from path
    const match = path.match(/^([^/]+)/);
    const ltsdId = match ? match[1] : '550e8400-e29b-41d4-a716-446655440011';
    return Response.json(mockChainOverview(ltsdId));
  }
  
  return proxyRequest(request, `/api/chain/${path}`);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { rest: string[] } }
) {
  const path = params.rest.join('/');
  
  if (shouldUseMock()) {
    const body = await request.json();
    // Handle request-coo, upload init, complete, etc.
    if (path.includes('request-coo')) {
      return Response.json({ success: true, emailSent: true });
    }
    if (path.includes('upload/init')) {
      return Response.json({
        uploadUrl: 'https://example.com/upload',
        documentId: '550e8400-e29b-41d4-a716-446655440099',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      });
    }
    if (path.includes('upload/complete')) {
      return Response.json({ success: true, revalidated: true });
    }
    return Response.json({ success: true });
  }
  
  return proxyRequest(request, `/api/chain/${path}`, {
    method: 'POST',
    body: await request.text(),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { rest: string[] } }
) {
  const path = params.rest.join('/');
  
  if (shouldUseMock()) {
    return Response.json({ success: true });
  }
  
  return proxyRequest(request, `/api/chain/${path}`, {
    method: 'PUT',
    body: await request.text(),
  });
}
