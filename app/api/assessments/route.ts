import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock, mockAssessments } from '../_lib';

export async function GET(request: NextRequest) {
  if (shouldUseMock()) {
    return Response.json(mockAssessments());
  }
  return proxyRequest(request, '/api/assessments');
}
