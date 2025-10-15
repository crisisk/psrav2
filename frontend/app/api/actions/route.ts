import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Type definitions for Action entity
export interface Action {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  dueDate: string;
  assignedTo: string;
  regulationReference: string;
  createdAt: string;
  updatedAt: string;
}

// Mock database (replace with real DB implementation)
class MockDB {
  private actions: Action[] = [];

  async getActions(): Promise<Action[]> {
    return this.actions;
  }

  async createAction(data: Omit<Action, 'id' | 'createdAt' | 'updatedAt'>): Promise<Action> {
    const newAction: Action = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.actions.push(newAction);
    return newAction;
  }

  async updateAction(id: string, data: Partial<Action>): Promise<Action | null> {
    const index = this.actions.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    const updatedAction = {
      ...this.actions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.actions[index] = updatedAction;
    return updatedAction;
  }

  async deleteAction(id: string): Promise<boolean> {
    const initialLength = this.actions.length;
    this.actions = this.actions.filter(a => a.id !== id);
    return this.actions.length !== initialLength;
  }
}

const db = new MockDB();

// GET all actions
export async function GET() {
  try {
    const actions = await db.getActions();
    return NextResponse.json(actions);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch actions' },
      { status: 500 }
    );
  }
}

// POST new action
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.title || !body.description || !body.dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newAction = await db.createAction({
      ...body,
      status: 'pending',
      regulationReference: body.regulationReference || '',
      assignedTo: body.assignedTo || '',
    });

    return NextResponse.json(newAction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create action' },
      { status: 500 }
    );
  }
}

// PUT update action
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Missing action ID' },
        { status: 400 }
      );
    }

    const updatedAction = await db.updateAction(body.id, body);
    
    if (!updatedAction) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAction);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// DELETE action
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing action ID' },
        { status: 400 }
      );
    }

    const success = await db.deleteAction(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}
