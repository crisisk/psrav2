import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { CERTIFICATE_STATUSES, createCertificate, listCertificates } from '@/lib/repository';
import { ensureOriginWriteAccess } from '@/lib/security/authorization';
import { isValidHsCode, normalizeHsCode } from '@/lib/utils/hs-code';

const hs6Schema = z
  .coerce.string()
  .transform(value => normalizeHsCode(value))
  .refine(code => isValidHsCode(code), { message: 'HS code must contain exactly 6 digits' });

const Query = z.object({
  status: z.enum([...CERTIFICATE_STATUSES]).optional(),
  hs6: hs6Schema.optional(),
  agreement: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(200).default(25)
});

const CreateBody = z.object({
  productSku: z.string().min(1),
  hs6: hs6Schema,
  agreement: z.string().min(1),
  result: z.union([z.record(z.string(), z.unknown()), z.unknown()]).optional(),
  status: z.enum([...CERTIFICATE_STATUSES]).default('pending')
});

export async function GET(req: NextRequest) {
  const q = Query.parse(Object.fromEntries(req.nextUrl.searchParams));
  const { items, total } = await listCertificates(q);
  return NextResponse.json({ items, total, page: q.page, pageSize: q.pageSize });
}

export async function POST(req: NextRequest) {
  const accessViolation = ensureOriginWriteAccess(req);
  if (accessViolation) {
    return accessViolation;
  }

  try {
    const body = await req.json();
    const data = CreateBody.parse(body);

    const certificate = await createCertificate({
      productSku: data.productSku,
      hs6: data.hs6,
      agreement: data.agreement,
      status: data.status,
      result: data.result
    });

    if (!certificate) {
      return NextResponse.json(
        { error: 'Unable to create certificate' },
        { status: 500 }
      );
    }

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating certificate:', error);
    return NextResponse.json({ error: 'Failed to create certificate' }, { status: 500 });
  }
}
