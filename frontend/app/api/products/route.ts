import { NextResponse } from 'next/server';
import { z } from 'zod';

const searchParamsSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100)
});

const mockProducts = [
  { id: 1, name: 'Industrial Valves', hsCode: '8481.80.00', description: 'Pressure reducing valves' },
  { id: 2, name: 'Electric Transformers', hsCode: '8504.23.00', description: 'Liquid dielectric transformers' },
  { id: 3, name: 'Solar Panels', hsCode: '8541.42.00', description: 'Photovoltaic modules' }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');

    const validation = searchParamsSchema.safeParse({ query });
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const filteredProducts = mockProducts.filter(product =>
      product.name.toLowerCase().includes(validation.data.query.toLowerCase()) ||
      product.hsCode.toLowerCase().includes(validation.data.query.toLowerCase())
    );

    return NextResponse.json({ data: filteredProducts });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}