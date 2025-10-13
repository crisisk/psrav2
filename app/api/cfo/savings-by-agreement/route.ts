import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockSavingsByAgreement } from '../../_lib';

export async function GET(request: NextRequest) {
  if (shouldUseMock()) {
    return Response.json(mockSavingsByAgreement());
  }
  return proxyRequest(request, '/api/cfo/savings-by-agreement');
}
