import { NextResponse } from 'next/server';

type Section = {
  id: string;
  title: string;
  content: string;
};

export async function GET() {
  try {
    // Simulated database fetch
    const sections: Section[] = [
      { id: '1', title: 'Technical Documentation', content: '...' },
      { id: '2', title: 'Quality Assurance', content: '...' },
    ];

    return NextResponse.json({ data: sections });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}
