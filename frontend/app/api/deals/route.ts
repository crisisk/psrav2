import { NextResponse } from 'next/server';
import { DealStage } from '@/types';

type Deal = {
  id: string;
  name: string;
  stage: DealStage;
  amount: number;
  contact: string;
  createdAt: Date;
  updatedAt: Date;
};

// In-memory database for demonstration
let deals: Deal[] = [];

export async function GET() {
  try {
    return NextResponse.json({ data: deals });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch deals' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.contact) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newDeal: Deal = {
      id: crypto.randomUUID(),
      name: body.name,
      stage: DealStage.NEW,
      amount: body.amount || 0,
      contact: body.contact,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    deals.push(newDeal);
    return NextResponse.json({ data: newDeal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create deal' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { id, stage } = await request.json();

    if (!id || !Object.values(DealStage).includes(stage)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const dealIndex = deals.findIndex(deal => deal.id === id);
    if (dealIndex === -1) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    deals[dealIndex] = {
      ...deals[dealIndex],
      stage,
      updatedAt: new Date()
    };

    return NextResponse.json({ data: deals[dealIndex] });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update deal' },
      { status: 500 }
    );
  }
}