import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that should skip middleware processing
const SKIP_PATHS = [
  '/_next',
  '/static',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/.well-known',
];

// Pre-compile regex patterns
const UNIVERSITY_MEMORIAL_PATTERN = /^\/university\/([^/]+)\/memorials\/([^/]+)$/;
const UNIVERSITY_PROFILE_PATTERN = /^\/university\/([^/]+)\/profile\/([^/]+)$/;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Early return for development environment
  if (process.env.NODE_ENV !== 'production') {
    return NextResponse.next();
  }

  // Early return for static files and API routes
  if (SKIP_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Handle university memorial routes
  const memorialMatch = pathname.match(UNIVERSITY_MEMORIAL_PATTERN);
  if (memorialMatch) {
    const [, universityId, memorialId] = memorialMatch;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-university-id', universityId);
    requestHeaders.set('x-memorial-id', memorialId);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Handle profile routes
  const profileMatch = pathname.match(UNIVERSITY_PROFILE_PATTERN);
  if (profileMatch) {
    const [, universityId, profileId] = profileMatch;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-university-id', universityId);
    requestHeaders.set('x-profile-id', profileId);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 