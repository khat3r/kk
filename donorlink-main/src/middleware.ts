// src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const protectedRoutes = ['/dashboard/donor', '/dashboard/clinic'];

// Helper to redirect unauthenticated users to login
function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if this route is protected
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    const token = request.cookies.get('donorlink_token')?.value;

    if (!token) {
      return redirectToLogin(request, pathname);
    }

    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
      const secret = new TextEncoder().encode(JWT_SECRET);

      // Validate the token
      await jwtVerify(token, secret);

      return NextResponse.next();
    } catch (err) {
      console.error('JWT verification failed in middleware:', err);
      return redirectToLogin(request, pathname);
    }
  }

  // Allow non-protected routes
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
