import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { validateInvoice } from '@/lib/invoice-validator';
import { ensureInvoiceUploadAccess } from '@/lib/security/authorization';

const bomSchema = z.object({
  sku: z.string().min(1),
  description: z.string().min(1),
  hsCode: z.string().min(4),
  value: z.number().nonnegative(),
  quantity: z.number().positive(),
  countryOfOrigin: z.string().optional(),
});

const payloadSchema = z.object({
  invoiceNumber: z.string().min(2),
  supplierName: z.string().min(1),
  currency: z.string().min(3).max(3),
  issuedAt: z.string().min(4),
  bomItems: z.array(bomSchema).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const accessViolation = ensureInvoiceUploadAccess(request);
    if (accessViolation) {
      return accessViolation;
    }

    const body = await request.json();
    const payload = payloadSchema.parse(body);

    const result = await validateInvoice(payload);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Factuurgegevens zijn onvolledig of ongeldig.',
          details: error.flatten(),
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        error: 'INVOICE_VALIDATION_FAILED',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
