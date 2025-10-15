import { NextResponse } from 'next/server';

interface Partner {
  id: number;
  name: string;
  url: string;
  description?: string;
}

export async function GET() {
  try {
    // Simulated data - replace with actual data source in production
    const partners: Partner[] = [
      {
        id: 1,
        name: 'European Cooperation for Accreditation',
        url: 'https://www.european-accreditation.org',
        description: 'European accreditation body for conformity assessment',
      },
      {
        id: 2,
        name: 'International Accreditation Forum',
        url: 'https://iaf.nu',
        description: 'Worldwide association of accreditation bodies',
      },
    ];

    // Simulate delay for realistic loading state
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json(partners);
  } catch (error) {
    console.error('Failed to fetch partners:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
