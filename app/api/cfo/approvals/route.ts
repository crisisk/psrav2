import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockApprovals } from '../../_lib';

export async function GET(request: NextRequest) {
  if (shouldUseMock()) {
    return Response.json(mockApprovals());
  }
  return proxyRequest(request, '/api/cfo/approvals');
}

export async function POST(request: NextRequest) {
  if (shouldUseMock()) {
    const body = await request.json();
    return Response.json({ success: true, approvalId: body.id });
  }
  return proxyRequest(request, '/api/cfo/approvals', {
    method: 'POST',
    body: await request.text(),
  });
}
