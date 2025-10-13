import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const publicPaths = ['/', '/demo', '/privacy', '/help', '/features', '/tech'];
const apiPaths = ['/api/', '/_next/', '/static/', '/_next/static/'];

// For now, allow all routes since we're in demo mode
// Role-based access control will be enabled when Keycloak is integrated
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow API and Next.js internal routes
  if (apiPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static files
  if (pathname.includes('.')) {
    return NextResponse.next();
  }

  // For demo mode, allow all authenticated routes
  // TODO: Implement proper role checking when Keycloak is integrated
  return NextResponse.next();
}

// Configure paths that should trigger the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes (/api/*)
     * - Next.js internal paths (/_next/*)
     * - Static files (*.png, *.jpg, etc.)
     */
    '/((?!api|_next|.*\\..*).*)',
  ],
};
