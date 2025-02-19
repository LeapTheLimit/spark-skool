import { NextResponse } from 'next/server';
import { getTeacherData } from '@/lib/auth';

export async function GET() {
  const teacher = await getTeacherData();

  if (!teacher) {
    return NextResponse.json({ 
      isAuthenticated: false 
    });
  }

  return NextResponse.json({ 
    isAuthenticated: true,
    teacher
  });
} 