import { NextRequest } from 'next/server';
import { proxyRequest, shouldUseMock } from '@/lib/proxy';
import { mockXaiExplanation } from '@/lib/mock';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const assessmentId = params.id;

  if (shouldUseMock()) {
    return Response.json(mockXaiExplanation(assessmentId));
  }

  return proxyRequest(`/api/assessments/${assessmentId}/xai`);
}
