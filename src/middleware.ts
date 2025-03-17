import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

<<<<<<< HEAD
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
=======
export async function middleware(request: NextRequest) {
  // Get current user from localStorage
  const currentUser = request.cookies.get('currentUser');

  // Protect teacher dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard/teacher')) {
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
    if (!currentUser) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
<<<<<<< HEAD
    '/api/:path*',
    '/dashboard/:path*',
    '/avatars/:path*'
=======
    '/dashboard/teacher/:path*',
    '/dashboard/student/:path*'
>>>>>>> 90ba128b77a37239696f731a4cbfd4c1385d90f6
  ]
}; 