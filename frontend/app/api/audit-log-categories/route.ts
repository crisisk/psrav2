import { NextResponse } from 'next/server';

// Mock data for audit log categories
const mockCategories = [
  { id: '1', name: 'Authentication' },
  { id: '2', name: 'Authorization' },
  { id: '3', name: 'Data Access' },
  { id: '4', name: 'System Events' },
];

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return NextResponse.json({
      success: true,
      data: mockCategories,
    });
  } catch (error) {
    console.error('[AUDIT_LOG_CATEGORIES] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}