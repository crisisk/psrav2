import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockCfoKpis } from '../../_lib';

export async function GET(request: NextRequest) {
  if (shouldUseMock()) {
    return Response.json(mockCfoKpis());
  }
  return proxyRequest(request, '/api/cfo/kpis');
}
