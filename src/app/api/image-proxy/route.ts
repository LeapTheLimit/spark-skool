import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const defaultImagePath = '/images/default-avatar.png';
  
  try {
    const url = new URL(request.url);
    const imagePath = url.pathname;
    
    // Check if the requested image exists
    try {
      await fetch(new URL(imagePath, request.url));
    } catch {
      // Return default image if requested image doesn't exist
      return NextResponse.redirect(new URL(defaultImagePath, request.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL(defaultImagePath, request.url));
  }
} 