import { NextResponse, type NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('session')?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}
