import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockCfoTrend } from '../../_lib';

export async function GET(request: NextRequest) {
  if (shouldUseMock()) {
    return Response.json(mockCfoTrend());
  }
  return proxyRequest(request, '/api/cfo/trend');
}
