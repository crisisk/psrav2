import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockAtRisk } from '../../_lib';

export async function GET(request: NextRequest) {
  if (shouldUseMock()) {
    return Response.json(mockAtRisk());
  }
  return proxyRequest(request, '/api/cfo/at-risk');
}
