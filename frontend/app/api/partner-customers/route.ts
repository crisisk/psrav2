import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

// Type for partner customer data
interface PartnerCustomer {
  id: string;
  partner_id: string;
  customer_name: string;
  assessment_date: Date;
  compliance_status: 'pending' | 'approved' | 'rejected';
}

// API response type
type ApiResponse = {
  success: boolean;
  data?: PartnerCustomer[];
  error?: string;
};

export async function GET() {
  try {
    // Fetch partner customers with conformity assessments
    const results = await query<PartnerCustomer>(
      `SELECT 
        pc.id,
        pc.partner_id,
        pc.customer_name,
        ca.assessment_date,
        ca.status as compliance_status
       FROM partner_customers pc
       JOIN conformity_assessments ca ON pc.id = ca.partner_customer_id
       ORDER BY ca.assessment_date DESC`
    );

    return NextResponse.json<ApiResponse>({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('[PARTNER_CUSTOMERS_GET]', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch partner customers'
    }, { status: 500 });
  }
}
