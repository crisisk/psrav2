import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockInsights } from '../../_lib';

export async function GET(request: NextRequest) {
  if (shouldUseMock()) {
    return Response.json(mockInsights());
  }
  return proxyRequest(request, '/api/insights/overview');
}
