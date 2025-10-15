import { NextResponse } from 'next/server';
import {
  type AiSystem,
  type CreateAiSystemDto,
  createAiSystem,
  getAllAiSystems,
  updateAiSystem,
  deleteAiSystem,
} from '@/lib/services/ai-system-service';

// GET all AI systems
export async function GET() {
  try {
    const systems = await getAllAiSystems();
    return NextResponse.json(systems);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch AI systems' },
      { status: 500 }
    );
  }
}

// CREATE new AI system
export async function POST(request: Request) {
  try {
    const body: CreateAiSystemDto = await request.json();
    
    // Validation
    if (!body.name || !body.provider) {
      return NextResponse.json(
        { error: 'Name and provider are required' },
        { status: 400 }
      );
    }

    const newSystem = await createAiSystem(body);
    return NextResponse.json(newSystem, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create AI system' },
      { status: 500 }
    );
  }
}

// UPDATE existing AI system
export async function PUT(request: Request) {
  try {
    const system: AiSystem = await request.json();

    if (!system.id) {
      return NextResponse.json(
        { error: 'System ID is required for update' },
        { status: 400 }
      );
    }

    const updatedSystem = await updateAiSystem(system);
    return NextResponse.json(updatedSystem);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update AI system' },
      { status: 500 }
    );
  }
}

// DELETE AI system
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'System ID is required' },
        { status: 400 }
      );
    }

    await deleteAiSystem(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete AI system' },
      { status: 500 }
    );
  }
}