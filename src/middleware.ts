import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle API routes first
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Handle avatar images with redirect to the avatar API
  if (request.nextUrl.pathname.startsWith('/avatars/')) {
    return NextResponse.redirect(new URL('/api/avatar', request.url));
  }

  // Handle auth protection for dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard/')) {
    const currentUser = request.cookies.get('currentUser');
    if (!currentUser) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/avatars/:path*'
  ]
}; 