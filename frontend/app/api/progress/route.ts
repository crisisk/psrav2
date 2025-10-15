import { NextResponse } from 'next/server';

interface ProgressData {
  analyzedPages: number;
  totalPages: number;
}

export async function GET() {
  try {
    // Simulate API response delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock data - replace with actual data source in production
    const progressData: ProgressData = {
      analyzedPages: 20,
      totalPages: 240
    };

    return NextResponse.json(progressData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}
