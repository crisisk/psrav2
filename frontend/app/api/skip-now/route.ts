import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // In production: Add actual skip logic here
    // e.g., update user preferences or track temporary dismissal
    return NextResponse.json(
      { success: true, message: 'Skipped successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SKIP_NOW_API_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}