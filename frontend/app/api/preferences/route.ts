import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { UserPreferences } from '@/lib/types/user-preferences';

// Mock database (replace with real database implementation)
const mockDB: Record<string, UserPreferences> = {};

// Zod schema for preferences validation
const preferencesSchema = z.object({
  pageSize: z.number().min(5).max(100),
  theme: z.enum(['light', 'dark']),
  columnVisibility: z.record(z.boolean())
});

export async function GET(request: NextRequest) {
  try {
    // In real implementation, get user ID from session
    const userId = 'user-123'; // Mock user ID
    
    const preferences = mockDB[userId] || {
      pageSize: 20,
      theme: 'light',
      columnVisibility: {}
    };

    return NextResponse.json(preferences);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = 'user-123'; // Mock user ID
    const body = await request.json();

    // Validate request body
    const validation = preferencesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    // Merge existing preferences with new ones
    const existing = mockDB[userId] || {};
    const updatedPreferences: UserPreferences = {
      ...existing,
      ...validation.data
    };

    mockDB[userId] = updatedPreferences;

    return NextResponse.json(updatedPreferences);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
