import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Stub type for Option (Prisma schema not available)
type Option = {
  id: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
};

const OptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export async function GET() {
  try {
    const options: Option[] = await prisma.option.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(options)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch options' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = OptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    const newOption = await prisma.option.create({
      data: validation.data,
    })

    return NextResponse.json(newOption, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create option' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json()
    const validation = OptionSchema.safeParse(data)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    const updatedOption = await prisma.option.update({
      where: { id },
      data: validation.data,
    })

    return NextResponse.json(updatedOption)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update option' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()

    await prisma.option.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete option' },
      { status: 500 }
    )
  }
}
