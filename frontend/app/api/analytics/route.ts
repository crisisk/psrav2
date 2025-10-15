import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { computeMockAnalytics } from '@/lib/mock-data';
import { isDatabaseEnabled } from '@/lib/config';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const timeframe = searchParams.get('timeframe') || '30d';

  const endDate = new Date();
  const startDate = new Date();

  switch (timeframe) {
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  if (!isDatabaseEnabled) {
    const fallback = computeMockAnalytics(startDate, endDate);
    const response = NextResponse.json({
      timeframe,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: fallback.summary,
      certificates: fallback.certificates,
      tradeAgreements: fallback.tradeAgreements,
      status: 'mock',
      reason: 'database-disabled',
    });
    response.headers.set('x-data-source', 'mock');
    return response;
  }

  try {
    const basicStats = await getBasicAnalytics(startDate, endDate);
    const certificateStats = await getCertificateAnalytics(startDate, endDate);
    const tradeAgreementStats = await getTradeAgreementAnalytics(startDate, endDate);

    const response = NextResponse.json({
      timeframe,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: basicStats,
      certificates: certificateStats,
      tradeAgreements: tradeAgreementStats,
      status: 'success',
    });
    response.headers.set('x-data-source', 'database');
    return response;
  } catch (error) {
    console.error('Analytics error:', error);
    const fallback = computeMockAnalytics(startDate, endDate);
    const response = NextResponse.json({
      timeframe,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: fallback.summary,
      certificates: fallback.certificates,
      tradeAgreements: fallback.tradeAgreements,
      status: 'mock',
      reason: 'database-error',
    });
    response.headers.set('x-data-source', 'mock');
    return response;
  }
}

async function getBasicAnalytics(startDate: Date, endDate: Date) {
  try {
    const result = await query(`
      SELECT
        COUNT(*) as total_certificates,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_certificates,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_certificates,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_certificates
      FROM certificates
      WHERE "createdAt" BETWEEN $1 AND $2
    `, [startDate, endDate]);

    return result.rows?.[0] || {
      total_certificates: 0,
      completed_certificates: 0,
      pending_certificates: 0,
      processing_certificates: 0
    };
  } catch (error) {
    console.error('Basic analytics error:', error);
    throw error;
  }
}

async function getCertificateAnalytics(startDate: Date, endDate: Date) {
  try {
    // Status distribution
    const statusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM certificates 
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY status
    `, [startDate, endDate]);
    
    // Conformity rate for completed certificates
    const conformityResult = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN (result->>'isConform')::boolean = true THEN 1 END) as conforming,
        AVG((result->>'confidence')::float) as avg_confidence
      FROM certificates 
      WHERE "createdAt" BETWEEN $1 AND $2 
        AND status = 'done' 
        AND result IS NOT NULL
    `, [startDate, endDate]);
    
    return {
      statusDistribution: statusResult.rows || [],
      conformityRate: conformityResult.rows?.[0] || { total: 0, conforming: 0, avg_confidence: 0 }
    };
  } catch (error) {
    console.error('Certificate analytics error:', error);
    throw error;
  }
}

async function getTradeAgreementAnalytics(startDate: Date, endDate: Date) {
  try {
    const result = await query(`
      SELECT 
        agreement,
        COUNT(*) as total_certificates,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_certificates
      FROM certificates 
      WHERE "createdAt" BETWEEN $1 AND $2
      GROUP BY agreement
      ORDER BY total_certificates DESC
    `, [startDate, endDate]);
    
    return result.rows || [];
  } catch (error) {
    console.error('Trade agreement analytics error:', error);
    throw error;
  }
}


