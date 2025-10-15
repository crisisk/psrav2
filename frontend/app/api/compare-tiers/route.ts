import { NextResponse } from 'next/server';

interface TierComparison {
  tier: string;
  features: string[];
  limit: number | string;
}

export async function GET() {
  try {
    // Simulated data source - replace with actual database call
    const comparisonData: TierComparison[] = [
      {
        tier: 'Free',
        features: ['Basic Audit Logs', '7-day Retention'],
        limit: 1000
      },
      {
        tier: 'Pro',
        features: ['Advanced Audit Logs', '30-day Retention', 'API Access'],
        limit: 10000
      },
      {
        tier: 'Enterprise',
        features: ['Full Audit Logs', 'Custom Retention', '24/7 Support'],
        limit: 'Unlimited'
      }
    ];

    return NextResponse.json({ data: comparisonData }, { status: 200 });
  } catch (error) {
    console.error('Tier comparison error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tier comparison data' },
      { status: 500 }
    );
  }
}