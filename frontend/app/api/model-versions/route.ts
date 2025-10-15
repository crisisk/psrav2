import { NextResponse } from 'next/server';

interface ModelVersion {
  id: string;
  name: string;
  version: string;
}

export async function GET() {
  try {
    // Simulated data - in real application this would come from a database or external API
    const modelVersions: ModelVersion[] = [
      { id: 'podm-2.3', name: 'Predictive Origin Determination Model', version: 'v2.3' }
    ];

    return NextResponse.json(
      { data: modelVersions },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch model versions' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
