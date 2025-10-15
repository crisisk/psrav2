import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mockTradeAgreements } from '@/lib/mock-data';

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM trade_agreements WHERE active = true ORDER BY name ASC'
    );
    
    return NextResponse.json({
      agreements: result.rows || [],
      total: result.rows?.length || 0
    });
  } catch (error) {
    console.error('Error fetching trade agreements:', error);
    return NextResponse.json({
      agreements: mockTradeAgreements,
      total: mockTradeAgreements.length,
      source: 'mock',
    });
  }
}
