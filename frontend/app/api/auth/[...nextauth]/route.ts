import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Stub NextAuth route handlers for production build
// Replace with actual NextAuth implementation when auth is configured

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'NextAuth endpoint - configure authentication to enable',
    providers: []
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'NextAuth endpoint - configure authentication to enable',
    providers: []
  });
}
