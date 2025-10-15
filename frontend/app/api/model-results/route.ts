import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ModelResult {
  id: string;
  modelName: string;
  executionDate: Date;
  status: 'success' | 'failed';
  accuracy?: number;
}

export async function GET() {
  try {
    const results = await db.modelResult.findMany();
    const modelResults: ModelResult[] = results.map((result: any) => ({
      id: result.id,
      modelName: result.modelName,
      executionDate: result.executionDate,
      status: result.status,
      accuracy: result.accuracy
    }));
    return NextResponse.json({ data: modelResults });
  } catch (error) {
    console.error('Error fetching model results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model results' },
      { status: 500 }
    );
  }
}
