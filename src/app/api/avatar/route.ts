import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  // Redirect to a public URL for the default avatar
  return NextResponse.redirect(
    'https://ui-avatars.com/api/?name=Teacher&background=0D8ABC&color=fff'
  );
} 