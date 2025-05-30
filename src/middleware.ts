import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Skip middleware for static files and API routes
const SKIP_PATHS = [
  '/',
  '/_next',
  '/api',
  '/static',
  '/auth',
  '/favicon.ico',
  '/manifest.json',
  '/robots.txt'
];

const STORIATS_ADMIN_EMAILS = [
  'matthew.bo@storiats.com',
  'derek.lee@storiats.com',
  'justin.lontoh@storiats.com'
];

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes
  if (SKIP_PATHS.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip middleware during server-side rendering
  if (request.headers.get('x-middleware-skip')) {
    return NextResponse.next();
  }

  try {
    // For non-protected routes, just proceed
    if (!request.nextUrl.pathname.startsWith('/admin') && 
        !request.nextUrl.pathname.startsWith('/university') && 
        !request.nextUrl.pathname.startsWith('/college') && 
        !request.nextUrl.pathname.startsWith('/institute')) {
      return NextResponse.next();
    }

    const db = await getDb();
    if (!db) {
      console.error('Firestore is not initialized');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Check if this is an admin route
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      const userId = authHeader.split(' ')[1];
      if (!userId) {
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      try {
        // Get user document
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        const userData = userDoc.data();
        const userEmail = userData.email;

        // Check if user is a Storiats admin
        if (!STORIATS_ADMIN_EMAILS.includes(userEmail)) {
          return NextResponse.redirect(new URL('/403', request.url));
        }

        return NextResponse.next();
      } catch (error) {
        console.error('Error checking admin access:', error);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    // Extract organization ID from the path
    const pathParts = request.nextUrl.pathname.split('/');
    const orgId = pathParts[1]; // e.g., /university/123 -> university

    // Check if this is an organization route
    if (orgId === 'university' || orgId === 'college' || orgId === 'institute') {
      const orgDocId = pathParts[2]; // e.g., /university/123 -> 123
      
      if (!orgDocId) {
        return NextResponse.redirect(new URL('/404', request.url));
      }

      try {
        // Verify organization exists
        const orgDoc = await getDoc(doc(db, 'organizations', orgDocId));
        if (!orgDoc.exists()) {
          return NextResponse.redirect(new URL('/404', request.url));
        }

        // Check if user has access to this organization
        const authHeader = request.headers.get('authorization');
        if (!authHeader) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        const userId = authHeader.split(' ')[1];
        if (!userId) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        // Get user's organization roles
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          return NextResponse.redirect(new URL('/auth/login', request.url));
        }

        const userData = userDoc.data();
        const orgRoles = userData.orgRoles || {};

        // Check if user has a role for this organization
        if (!orgRoles[orgDocId]) {
          return NextResponse.redirect(new URL('/403', request.url));
        }

        // Check if user has the required role for the requested action
        const role = orgRoles[orgDocId];
        const isAdminRoute = request.nextUrl.pathname.includes('/admin');
        if (isAdminRoute && role !== 'admin') {
          return NextResponse.redirect(new URL('/403', request.url));
        }
      } catch (error) {
        console.error('Error checking organization access:', error);
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}; 