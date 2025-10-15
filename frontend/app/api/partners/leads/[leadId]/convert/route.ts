import { NextRequest, NextResponse } from 'next/server';
import { PartnerLeadService } from '@/lib/services/partnerLeadService';

export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const leadId = params.leadId;
    
    // Validate lead ID format
    if (!/^[0-9a-fA-F]{24}$/.test(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    const service = new PartnerLeadService();
    const result = await service.convertLeadToCustomer(leadId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode }
      );
    }

    return NextResponse.json(
      { message: 'Lead converted successfully', customer: result.customer },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error converting lead:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
