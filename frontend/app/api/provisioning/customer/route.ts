import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { PartnerProvisioningService } from '@/lib/services/partnerProvisioning';

type ProvisionCustomerRequest = {
  partnerId: string;
  customerId: string;
  accessLevel: 'basic' | 'premium';
};

type ProvisionCustomerResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

const requestSchema = z.object({
  partnerId: z.string().uuid(),
  customerId: z.string().uuid(),
  accessLevel: z.enum(['basic', 'premium'])
});

export async function POST(request: Request) {
  try {
    const body: ProvisionCustomerRequest = await request.json();
    const validated = requestSchema.parse(body);

    const service = new PartnerProvisioningService();
    await service.provisionCustomerAccess(validated);

    return NextResponse.json<ProvisionCustomerResponse>({
      success: true,
      message: 'Customer access provisioned successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json<ProvisionCustomerResponse>({
        success: false,
        error: 'Invalid request data: ' + error.issues.map(i => i.message).join(', ')
      }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json<ProvisionCustomerResponse>({
        success: false,
        error: error.message
      }, { status: error.message.includes('not found') ? 404 :
           error.message.includes('access') ? 403 : 500 });
    }

    return NextResponse.json<ProvisionCustomerResponse>({
      success: false,
      error: 'Unknown error occurred'
    }, { status: 500 });
  }
}
