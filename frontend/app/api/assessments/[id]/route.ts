import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();

    if (!params.id) {
      return new NextResponse('Assessment ID missing', { status: 400 });
    }

    const updatedAssessment = await db.assessment.update({
      where: { id: params.id },
      data: { status: status }
    });

    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error('[ASSESSMENT_PATCH]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return new NextResponse('Assessment ID missing', { status: 400 });
    }

    await db.assessment.delete({
      where: { id: params.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[ASSESSMENT_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
