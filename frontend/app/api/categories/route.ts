import { NextResponse } from 'next/server';

type Category = {
  id: number;
  name: string;
  description: string;
};

export async function GET() {
  try {
    // Simulate database fetch with static data
    const categories: Category[] = [
      { id: 1, name: 'Brochures', description: 'Marketing brochures and pamphlets' },
      { id: 2, name: 'Case Studies', description: 'Detailed client success stories' },
      { id: 3, name: 'Presentations', description: 'Sales and product presentations' },
      { id: 4, name: 'Logos', description: 'Brand assets and logo packages' },
      { id: 5, name: 'Videos', description: 'Product demos and explainer videos' },
      { id: 6, name: 'Documentation', description: 'Technical specifications and manuals' },
    ];

    // Simulate delay for realistic loading state
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}