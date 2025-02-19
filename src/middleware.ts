import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get current user from localStorage
  const currentUser = request.cookies.get('currentUser');

  // Protect teacher dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard/teacher')) {
    if (!currentUser) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/teacher/:path*',
    '/dashboard/student/:path*'
  ]
}; 