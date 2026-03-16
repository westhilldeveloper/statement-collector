// src/middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  const session = request.cookies.get('admin_session');
  const isAuthenticated = session?.value === 'authenticated';

  // Protect dashboard and admin routes
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // If already authenticated, redirect from login to dashboard
  if (request.nextUrl.pathname === '/login' && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
};